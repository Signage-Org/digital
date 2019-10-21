/* eslint no-console: 0 */
import Hapi from 'hapi';
import Inert from 'inert';
import fs from 'fs';
import cleanup from 'node-cleanup';
// import Path from 'path';
// import { ApolloServer } from 'apollo-server-hapi';
import {
  loggingPlugin,
  adminOkRoute,
  // makeStaticAssetRoutes,
  headerKeys,
  HeaderKeysOptions,
  // persistentQueryPlugin,
  // HapiGraphqlContextFunction,
} from '@cityofboston/hapi-common';
import { makeExecutableSchema, ApolloServer } from 'apollo-server-hapi';
import ldap from 'ldapjs';
import {
  Person,
  Group,
  objectClassArray,
  PersonClass,
  GroupClass,
  FilterOptionsClass,
  FilterOptions,
  LdapFilters,
  CustomAttributes,
  ResponseClass,
  LDAPEnvClass,
} from './interfaces';
import {
  renameObjectKeys,
  remapObjKeys,
  returnBool,
  // convertToBool,
  abstractDN,
} from '../lib/helpers';
import { typeDefs } from './graphql/typeDefs';

// import { makeRoutesForNextApp, makeNextHandler } from '@cityofboston/hapi-next';

// import {
//   GRAPHQL_PATH_KEY,
//   API_KEY_CONFIG_KEY,
//   HAPI_INJECT_CONFIG_KEY,
// } from '@cityofboston/next-client-common';

import decryptEnv from '@cityofboston/srv-decrypt-env';
// import schema, { Context, Source } from './graphql';
import { Source } from './graphql';
// import { Context, Source } from './graphql';
// import { PACKAGE_SRC_ROOT } from './util';
// import { AnnotatedFilePart, PACKAGE_SRC_ROOT } from './util';
// import { makeEmailTemplates } from './email/EmailTemplates';
// import { UploadPayload, UploadResponse } from '../lib/upload-types';

require('dotenv').config();
const env = new LDAPEnvClass(process.env);
const ldapClient = ldap.createClient({
  url: env.LDAP_URL,
  reconnect: true,
});

type Credentials = {
  source: Source;
};

declare module 'hapi' {
  interface AuthCredentials extends Credentials {
    key: string;
  }
}

const port = parseInt(process.env.PORT || env.LDAP_PORT, 10);

const bindLdapClient = (_force: Boolean = false) => {
  if (
    env.LDAP_BIN_DN === 'cn=svc_groupmgmt,cn=Users,o=localHDAPDev' ||
    _force
  ) {
    ldapClient.bind(env.LDAP_BIN_DN, env.LDAP_PASSWORD, function(err) {
      if (err) {
        console.log('ldapClient.bind err: ', err);
      }
    });
  }
};

const search_promise = (err, res) => {
  if (err) {
    console.log('[err]: ', err);
  }

  return new Promise((resolve, reject) => {
    const entries: object[] = Array();
    const refInstance = new objectClassArray({});
    res.on('searchEntry', entry => {
      // console.log('ENTRY: ', entry);
      let currEntry = entry.object || {};
      currEntry = renameObjectKeys(
        remapObjKeys(refInstance, currEntry),
        currEntry
      );

      if (currEntry.objectclass.indexOf('organizationalPerson') > -1) {
        const Person: Person = new PersonClass(currEntry);
        entries.push(Person);
      }

      if (
        currEntry.objectclass.indexOf('groupOfUniqueNames') > -1 ||
        currEntry.objectclass.indexOf('container') > -1
      ) {
        // console.log('entry.object: ', entry.object, '\n .........');
        currEntry['onlyActiveMembers'] = true;
        const Group: Group = new GroupClass(currEntry);
        entries.push(Group);
      }

      if (currEntry.objectclass.indexOf('organizationalRole') > -1) {
        // console.log('entry.object: ', entry.object, '\n .........');
        currEntry['onlyActiveMembers'] = true;
        const Group: Group = new GroupClass(currEntry);
        entries.push(Group);
      }
    });

    res.on('error', err => {
      console.error('error: ' + err.message);
      reject();
    });

    res.on('end', () => {
      // console.log('entries.length: ', entries.length, entries, '\n -------------- \n');
      resolve(entries);
    });
  });
};

const setAttributes = (attr = [''], type = 'group') => {
  const attrSet: Array<string> = [];
  attr.forEach(element => {
    if (type === 'group') {
      if (
        Object.keys(new GroupClass({})).indexOf(element) > -1 &&
        attrSet.indexOf(element) === -1
      ) {
        attrSet.push(element);
      }
    }
    if (type === 'person') {
      if (
        Object.keys(new PersonClass({})).indexOf(element) > -1 &&
        attrSet.indexOf(element) === -1
      ) {
        attrSet.push(element);
      }
    }
  });

  if (attrSet.length > 0) {
    return attrSet;
  }

  // Custom Attributes
  switch (attr[0]) {
    case 'all':
      return CustomAttributes.all;
    default:
      return CustomAttributes.default;
  }
};

const getFilterValue = (filter: FilterOptions) => {
  const searchFilterStr = (type: String) => {
    const objClass =
      type === 'group' ? 'groupOfUniqueNames' : 'organizationalPerson';
    if (type === 'group') {
      return `${LdapFilters.groups.pre}cn=*${filter.value}*))`;
    } else {
      return `(&(objectClass=${objClass})(|(displayName=*${filter.value}*)(sn=${
        filter.value
      }*)(givenname=${filter.value}*)(cn=${filter.value}*)))`;
    }
  };

  switch (filter.filterType) {
    case 'person':
      if (filter.allowInactive === false) {
        const retStr = `${LdapFilters.person.pre}${
          LdapFilters.person.inactive
        }cn=${filter.value}${LdapFilters.person.post}`;
        // console.log('filter.filterType > retStr: ', retStr);
        return retStr;
      }

      if (filter.value.length === 0) {
        return `${LdapFilters.person.default}`;
      }
      if (filter.field === 'search') {
        return searchFilterStr(filter.filterType);
      }

      return `${LdapFilters.person.pre}${filter.field}=${filter.value}${
        LdapFilters.person.post
      }`;
    case 'group':
      if (filter.value.length === 0) {
        return `${LdapFilters.groups.default}`;
      }
      if (filter.field === 'cn') {
        return `${LdapFilters.groups.pre}${filter.field}=${filter.value}${
          LdapFilters.groups.post
        }`;
      }
      if (filter.field === 'search') {
        return searchFilterStr(filter.filterType);
      }

      return `${LdapFilters.groups.pre}${filter.field}=${filter.value}${
        LdapFilters.groups.post
      }`;
    default:
      return LdapFilters.groups.default;
  }
};

const getDnsSearchResults = async (base_dn, filter, filterQryParams) => {
  const results = new Promise(function(resolve, reject) {
    bindLdapClient();
    if (
      filter.filterType === 'person' &&
      filter.field === 'cn' &&
      filter.value.length < 2
    ) {
      reject();
    }
    ldapClient.search(base_dn, filterQryParams, function(err, res) {
      if (err) {
        console.log('ldapsearch error: ', err);
      }
      resolve(search_promise(err, res));
    });
  });

  return results;
};

const getFilteredResults = async (filter: FilterOptions, filterQryParams) => {
  const promises = filter.dns.map(async value => {
    // console.log('\n[------------]-------', value.group.dn);
    return await getDnsSearchResults(value.group.dn, filter, filterQryParams);
  });
  const promisedRes = await Promise.all(promises);
  const res = promisedRes.flat(Infinity);

  return res.filter((v, i) => res.indexOf(v) === i);
};

const searchWrapper = async (
  attributes = ['dn,cn'],
  filter: FilterOptions = {
    filterType: 'group',
    field: '',
    value: LdapFilters.groups.default,
    allowInactive: true,
    dns: [],
  }
) => {
  const base_dn = env.LDAP_BASE_DN;
  const filterValue = getFilterValue(filter);
  // console.log('filterValue: ', filterValue);
  // console.log('filter: ', filter);
  const thisAttributes =
    typeof attributes === 'object' && attributes.length > 1
      ? attributes
      : setAttributes(attributes, filter.filterType);
  // console.log('thisAttributes: ', thisAttributes);
  const filterQryParams = {
    scope: 'sub',
    attributes: thisAttributes,
    filter: filterValue,
  };
  let results: any;

  if (filter.dns.length > 0) {
    // console.log('searchWrapper > filter.dns: ', filter.dns);
    try {
      // console.log('filter [][][][][]: ', filter);
      results = await getFilteredResults(filter, filterQryParams);
      // console.log('filteredResults: ', results);
    } catch (err) {
      console.log('filteredResults > err: ', err);
    }
    // console.log(Object.keys(filter.dns[0]), filter.dns[0].cn, filter.dns[0]);
  } else {
    results = new Promise(function(resolve, reject) {
      bindLdapClient();
      // console.log('searchWrapper: filterQryParams ', filterQryParams.filter);
      if (
        filter.filterType === 'person' &&
        filter.field === 'cn' &&
        filter.value.length < 2
      ) {
        reject();
      }
      // console.log('Filter Type: ', filter.filterType, 'Field: ', filter.field, ' | Search Val: ', filter.value, ' | env.LDAP_BASE_DN: ', env.LDAP_BASE_DN);
      ldapClient.search(base_dn, filterQryParams, function(err, res) {
        if (err) {
          console.log('ldapsearch error: ', err);
        }
        // console.log('ldapClient.search: filterValue ', filterValue, filterQryParams);
        resolve(search_promise(err, res));
      });
    });
  }
  // console.log('searchWrapper > results: ', results);

  return results;
};

const convertDnsToGroupDNs = async (dns: Array<string>) => {
  if (dns.length > 0) {
    const CNs = dns.map(str => str.split('SG_AB_GRPMGMT_')[1]);
    const promises = CNs.map(async value => {
      // console.log('value: ', value);
      const filterParams: FilterOptions = new FilterOptionsClass({
        filterType: 'group',
        field: 'cn',
        value,
        allowInactive: false,
      });
      const group: any = await searchWrapper(['all'], filterParams);
      // console.log('group: ', group);
      const groupRetObj =
        group.length > 0 && group[0].dn
          ? { dn: group[0].dn, cn: group[0].cn }
          : { dn: '', cn: '' };
      const retObj = {
        cn: value,
        filterParams,
        group: groupRetObj,
      };
      // console.log('groupRetObj: ', groupRetObj);
      return retObj;
    });
    const results = await Promise.all(promises);

    return results.filter(entry => entry.group.dn !== '');
    // return results;
  } else {
    return [];
  }
};

export async function makeServer() {
  const serverOptions = {
    port,
    ...(process.env.USE_SSL
      ? {
          tls: {
            key: fs.readFileSync('server.key'),
            cert: fs.readFileSync('server.crt'),
          },
        }
      : {}),
  };

  const server = new Hapi.Server(serverOptions);
  const startup = async () => {
    return async () => {};
  };

  const apiKeys: { [key: string]: Credentials } = {};

  if (process.env.API_KEYS) {
    process.env.API_KEYS.split(',').forEach(k => {
      apiKeys[k] = { source: 'unknown' };
    });
  }

  if (process.env.WEB_API_KEY) {
    apiKeys[process.env.WEB_API_KEY] = {
      source: 'web',
    };
  }

  server.auth.scheme('headerKeys', headerKeys);
  server.auth.strategy('apiHeaderKeys', 'headerKeys', {
    header: 'X-API-KEY',
    keys: apiKeys,
  } as HeaderKeysOptions);

  if (process.env.NODE_ENV !== 'test') {
    await server.register(loggingPlugin);
  }

  await server.register(Inert);

  // const contextFunction: HapiGraphqlContextFunction<Context> = ({
  //   request,
  // }) => {
  //   const source = request.auth.credentials
  //     ? request.auth.credentials.source
  //     : 'unknown';

  //   return {
  //     // registryDb: registryDbFactory.registryDb(),
  //     // stripe,
  //     // emails,
  //     // rollbar,
  //     source,
  //   };
  // };

  // const apolloServer = new ApolloServer({
  //   schema,
  //   context: contextFunction,
  //   extensions: [rollbarErrorExtension(rollbar)],
  // });

  // await apolloServer.applyMiddleware({
  //   app: server,
  //   route: {
  //     cors: true,
  //     auth:
  //       Object.keys(apiKeys).length || process.env.NODE_ENV == 'staging'
  //         ? 'apiHeaderKeys'
  //         : false,
  //   },
  // });

  // await server.register({
  //   plugin: persistentQueryPlugin,
  //   options: {
  //     queriesDirPath: Path.resolve(
  //       PACKAGE_SRC_ROOT,
  //       'server',
  //       'queries',
  //       'fulfillment'
  //     ),
  //   },
  // });

  server.route({
    method: 'GET',
    path: '/',
    handler: () => 'ok',
  });

  server.route(adminOkRoute);
  await addGraphQl(server);

  return {
    server,
    startup,
  };
}

const resolvers = {
  Mutation: {
    async updateGroupMembers() {
      // console.log('updateGroupMembers: ');
      try {
        const opts = arguments[1];
        // console.log('updateGroupMembers opts: ', opts);
        const memberCheck =
          typeof opts.uniquemember === 'object' && opts.uniquemember.length > 0;
        const members = memberCheck ? opts.uniquemember : [opts.uniquemember];
        const changeOpts = new ldap.Change({
          operation: opts.operation,
          modification: {
            uniquemember: members,
          },
        });
        // console.log('updateGroupMembers > updateGroupMembers > changeOpts: ', changeOpts); // remapObjKeys
        bindLdapClient(true);
        // req, res, next
        ldapClient.modify(opts.dn, changeOpts, async () => {});
      } catch (err) {
        console.log('Mutation > updateGroupMembers > err: ', err);
      }

      return new ResponseClass({});
    },
  },
  Query: {
    async isPersonInactive(parent: any, args: any) {
      if (parent) {
        console.log('parent: personSearch');
      }

      const retArr: Array<[]> = [];
      const promises = await args.people.map(async (cn: any) => {
        const value = cn.indexOf('=') > -1 ? abstractDN(cn)['cn'][0] : cn;
        const in_active = await isMemberActive(value);
        if (in_active === false) {
          retArr.push(cn);
        }
      });

      await Promise.all(promises);
      return retArr;
    },
    async personSearch(
      parent: any,
      args: { term: string; dns: Array<string> }
    ) {
      if (parent) {
        console.log('Query > parent: personSearch');
      }
      if (args.dns) {
        console.log('Query > personSearch > dns: ', args.dns);
      }
      // console.log('personSearch: (term) > ', args, args.term);
      const term = args.term;

      const filterParams: FilterOptions = new FilterOptionsClass({
        filterType: 'person',
        field: 'search',
        value: term,
        allowInactive: true,
      });
      const persons = await searchWrapper(['all'], filterParams);
      // console.log('persons: ', persons, '\n --------');
      return persons;
    },
    async person(parent: any, args: { cn: string; dns: Array<string> }) {
      if (parent) {
        console.log('Query > person > parent: person');
      }
      if (args.dns) {
        console.log('Query > person > person > dns: ', args.dns);
      }
      const value = args.cn.indexOf('=') > -1 ? args.cn.split('=')[1] : args.cn;
      // console.log('value: ', value);

      const filterParams: FilterOptions = new FilterOptionsClass({
        filterType: 'person',
        field: 'cn',
        value,
        allowInactive: false,
      });
      const person: any = await searchWrapper(['all'], filterParams);
      // console.log('person: ', person, '\n --------');
      return person;
    },
    async group(parent: any, args: { cn: string; dns: Array<string> }) {
      let dns: any = [];
      if (parent) {
        console.log('Query > group > parent: group');
      }
      if (args.dns) {
        dns = await convertDnsToGroupDNs(args.dns);
        // console.log('Query > group > dns: ', args.dns);
      }
      // console.log('dns: ', args);

      const value = args.cn;
      const filterParams: FilterOptions = new FilterOptionsClass({
        filterType: 'group',
        field: 'cn',
        value,
        dns,
      });
      const groups: any = await searchWrapper(['all'], filterParams);
      return groups;
    },
    async groupSearch(
      parent: any,
      args: { term: string; dns: Array<string>; activemembers: any }
    ) {
      let dns: any = [];
      if (parent) {
        console.log('parent: groups');
      }
      if (args.dns) {
        dns = await convertDnsToGroupDNs(args.dns);
        // console.log('dns: ', dns[dns.length-1]);
      }
      // console.log('Query > groupSearch > dns: ', args.dns, dns);

      const value = args.term;
      const filterParams: FilterOptions = new FilterOptionsClass({
        filterType: 'group',
        field: 'search',
        value,
        allowInactive: false,
        dns,
      });

      const groups: any = await searchWrapper(['all'], filterParams);
      if (args.activemembers && args.activemembers === true) {
        // console.log('Query > groupSearch > activemembers: ', args.activemembers);
        await groups.forEach(async group => {
          if (
            typeof group.uniquemember === 'object' &&
            group.uniquemember.length > 0
          ) {
            const activemembers: Array<[]> = [];
            group.uniquemember.forEach(async (memberSt: any) => {
              const value =
                memberSt.indexOf('=') > -1 ? memberSt.split('=')[1] : memberSt;
              const in_active = await isMemberActive(value);
              if (in_active === false) {
                activemembers.push(memberSt);
              }
            });
            // console.log('activemembers: ', activemembers, '\n', group.uniquemember, '\n');
          }
        });
        return groups;
      } else {
        return groups;
      }
    },
  },
};

const isMemberActive = async (cn: String) => {
  const filterParams: FilterOptions = new FilterOptionsClass({
    filterType: 'person',
    field: '',
    value: cn,
    allowInactive: false,
  });
  const person: any = await searchWrapper(['all'], filterParams);
  if (person && typeof person === 'object' && person.length > 0) {
    return returnBool(person[0].nsaccountlock);
  } else {
    return true;
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

async function addGraphQl(server: Hapi.Server) {
  const context = {};
  const apolloServer = new ApolloServer({
    schema,
    context,
  });

  await apolloServer.applyMiddleware({
    app: server,
    cors: true,
  });
}

export default async function startServer() {
  await decryptEnv();

  const { server, startup } = await makeServer();

  const shutdown = await startup();
  cleanup(exitCode => {
    shutdown().then(
      () => {
        process.exit(exitCode);
      },
      err => {
        console.log('CLEAN EXIT FAILED', err);
        process.exit(-1);
      }
    );

    cleanup.uninstall();
    return false;
  });

  await server.start();

  console.log(`> Ready on http://localhost:${port}`);
}
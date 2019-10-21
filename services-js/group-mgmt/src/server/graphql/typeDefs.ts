export const typeDefs = `
  type Group {
    dn: String
    cn: String
    controls: [String!]!
    uniquemember: [String!]!
    owner: [String!]!
    actualdn: String
    entrydn: String
    objectclass: [String]
    displayname: String
    ou: String
  }

  type Person {
    cn: String
    dn: String
    mail: String
    sn: String
    givenname: String
    displayname: String
    uid: String
    controls: [String!]!
    ismemberof: [String!]!
    inactive: Boolean
    nsaccountlock: String
    objectclass: [String]
  }

  type Error {
    resonse: String!
  }

  type ResponseBody {
    data: String!
    error: Error!
  }

  type Response {
    message: String!
    code: Int!
    body: ResponseBody!
  }

  type Query {
    person(cn: String! dns: [String]): [Person]
    personSearch(term: String! dns: [String]): [Person]!
    group(cn: String! dns: [String]): [Group]
    groupSearch(term: String! dns: [String] activemembers: Boolean): [Group]!
    isPersonInactive(people: [String!]!): [String]!
    Person(limit: Int!): [Person!]!
	}
	
  # Defines all available mutations.
  type Mutation {
    updateGroupMembers(
      dn: String!,
			binding: String!, 
			operation: String!
			uniquemember: String!
    ): Response
  }

  schema {
    query: Query
    mutation: Mutation
  }
`;

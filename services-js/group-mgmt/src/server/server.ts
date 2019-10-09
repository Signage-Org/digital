/* eslint no-console: 0 */
import Hapi from 'hapi';
import Inert from 'inert';
import cleanup from 'node-cleanup';

import { adminOkRoute } from '@cityofboston/hapi-common';

import decryptEnv from '@cityofboston/srv-decrypt-env';

const port = parseInt(process.env.PORT || '3000', 10);

export async function makeServer() {
  const serverOptions = {
    port,
  };

  const server = new Hapi.Server(serverOptions);

  const startup = async () => {
    return async () => {};
  };

  await server.register(Inert);

  server.route({
    method: 'GET',
    path: '/',
    // handler: (_, h) => h.redirect(process.env.ROOT_REDIRECT_URL || '/death'),
    handler: () => 'ok',
  });

  server.route(adminOkRoute);

  return {
    server,
    startup,
  };
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

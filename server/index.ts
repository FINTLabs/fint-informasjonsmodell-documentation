// Module dependencies
import * as path from 'path';
import chalk from 'chalk';
import * as fs from 'fs';

// Express
import * as http from 'http';
import * as Express from 'express';
import axios from 'axios';

// Express middlewares
import * as morgan from 'morgan';
import helmet from 'helmet';
import { parse as contentTypeParser } from 'content-type';

// Other
import { Logger } from './utils/Logger';
import { ERROR_MESSAGES } from './messages';
import * as Iconv from 'iconv-lite';

const favicon = require('serve-favicon');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

const GITHUB_ORGANISATION = process.env.GITHUB_ORGANISATION || 'FINTLabs';
const GITHUB_REPOSITORY = process.env.GITHUB_REPO || 'fint-informasjonsmodell';
const EA_XMI_FILENAME = process.env.EA_XMI_FILENAME || 'FINT-informasjonsmodell.xml';
const GITHUB_DEFAULT_HEADERS = {
  'User-Agent': 'NodeJS-Express',
  'cache-control': 'no-cache'
};

/**
 * The server.
 *
 * @class Server
 */
export class Server {
  public app: Express.Express;
  private port = parseInt(process.env.PORT || '3000', 10);
  private clientPath = path.join(__dirname, './public/browser');


  /**
   * Bootstrap the application.
   *
   * @returns {Promise<any>}
   * @constructor
   */
  static Initialize(): Promise<any> {
    Logger.log.debug(`
${chalk.green('**********************')}
${chalk.green.bold('  Starting server')}
${chalk.green('**********************')}
`);
    return new Server()
      .start()
      .then(() => Logger.log.debug('Server started...'))
      .catch((error: any) => {
        Logger.log.error((ERROR_MESSAGES[error.code]) ? ERROR_MESSAGES[error.code] : error);
      });
  }

  /**
   * Constructor.
   */
  constructor() {
    const appPath = path.resolve(__dirname);
    const me = this;

    // Setup ExpressJS application
    this.app = Express();

    // Setup security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"]
        }
      }
    }));

    // Strict content-type checking middleware
    this.app.use((req, res, next) => {
      const contentType = req.headers['content-type'];
      if (!contentType) {
        return next();
      }
      try {
        contentTypeParser(contentType);
        next();
      } catch (e) {
        return res.status(400).send('Invalid Content-Type header');
      }
    });

    // Strict content-length checking middleware
    this.app.use((req, res, next) => {
      const len = req.headers['content-length'];
      if (!len || /^\d+$/.test(len)) {
        return next();
      }
      return res.status(400).send('Invalid Content-Length header');
    });

    // Setup global middlewares
    this.app.use(morgan('combined', { stream: Logger.stream })); // Setup morgan access logger using winston

    // Configure express
    this.app.set('etag', false);        // TODO: Support etag
    this.app.disable('x-powered-by');   // Do not announce our architecture to the world!
    this.app.set('trust proxy', true);  // Listen for external requests

    // Setup static resources
    this.app.use(Express.static(this.clientPath));                    // Serve static paths
    const faviconPath = path.join(this.clientPath, 'favicon.ico');
    if (fs.existsSync(path.resolve(faviconPath))) {
      this.app.use(favicon(faviconPath)); // Serve favicon
    }

    Logger.log.info(`https://api.github.com/repos/${GITHUB_ORGANISATION}/${GITHUB_REPOSITORY}/releases/latest`);
    // Read github latest version
    this.app.get('/api/doc/latest', async (req: Express.Request, res: Express.Response) => {
      try {
        const { data } = await axios.get(
          `https://api.github.com/repos/${GITHUB_ORGANISATION}/${GITHUB_REPOSITORY}/releases/latest`,
          { headers: GITHUB_DEFAULT_HEADERS }
        );
        if (data && data.name) {
          return res.send(data.name);
        }
        Logger.log.error('Unexpected response when fetching latest release', data);
        return res.status(500).send(data);
      } catch (error) {
        Logger.log.error(error);
        if (axios.isAxiosError(error) && error.response) {
          return res.status(error.response.status).send(error.response.data);
        }
        return res.status(500).send(error);
      }
    });

    // Read github version tags
    this.app.get('/api/doc/versions', async (req: Express.Request, res: Express.Response) => {
      try {
        const { data } = await axios.get(
          `https://api.github.com/repos/${GITHUB_ORGANISATION}/${GITHUB_REPOSITORY}/releases`,
          { headers: GITHUB_DEFAULT_HEADERS }
        );
        if (Array.isArray(data)) {
          return res.send(data.map((r: any) => r.name));
        }
        Logger.log.error('Unexpected response when fetching release versions', data);
        return res.status(500).send(data);
      } catch (error) {
        Logger.log.error(error);
        if (axios.isAxiosError(error) && error.response) {
          return res.status(error.response.status).send(error.response.data);
        }
        return res.status(500).send(error);
      }
    });

    // Read github version tags
    this.app.get('/api/doc/branches', async (req: Express.Request, res: Express.Response) => {
      try {
        const { data } = await axios.get(
          `https://api.github.com/repos/${GITHUB_ORGANISATION}/${GITHUB_REPOSITORY}/branches`,
          { headers: GITHUB_DEFAULT_HEADERS }
        );
        if (Array.isArray(data)) {
          return res.send(
            data
              .map((r: any) => r.name)
              .sort((a: string, b: string) => {
                const isARelease = a.substring(0, 'release'.length) === 'release';
                const isBRelease = b.substring(0, 'release'.length) === 'release';

                if (a === 'master' || b === 'master') { return a === 'master' ? -1 : 1; }
                if (isARelease && !isBRelease) { return b !== 'master' ? -1 : 1; }
                if (!isARelease && isBRelease) { return a !== 'master' ? 1 : -1; }
                return a < b ? -1 : 1;
              })
              .filter((a: string) => !a.startsWith('dependabot'))
          );
        }
        Logger.log.error('Unexpected response when fetching branches', data);
        return res.status(500).send(data);
      } catch (error) {
        Logger.log.error(error);
        if (axios.isAxiosError(error) && error.response) {
          return res.status(error.response.status).send(error.response.data);
        }
        return res.status(500).send(error);
      }
    });

    // Pipe traffic to fetch raw github content
    this.app.get('/api/doc/:version', async (req: Express.Request, res: Express.Response) => {
      const url = `https://raw.githubusercontent.com/${GITHUB_ORGANISATION}/${GITHUB_REPOSITORY}/${req.params.version}/${EA_XMI_FILENAME}`;

      Logger.log.info('Fetching XMI-file: ', url);

      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const xml = Iconv.decode(Buffer.from(response.data), 'win-1252');

        return await new Promise<void>((resolve) => {
          parser.parseString(xml, function (parseError: any, result: any) {
            if (parseError) {
              Logger.log.error(parseError);
              res.status(500).send(parseError);
              resolve();
              return;
            }
            res.header({ 'content-type': 'text/json; charset=utf-8' });
            res.send(result);
            resolve();
          });
        });
      } catch (error) {
        Logger.log.error(error);
        if (axios.isAxiosError(error) && error.response) {
          return res.status(error.response.status).send(error.response.data || 'Error fetching content');
        }
        return res.status(500).send('Error fetching content');
      }
    });

    this.app.get('/health', (req: Express.Request, res: Express.Response) => {
      res.send();
    });

    // Setup base route to everything else
    this.app.use((req: Express.Request, res: Express.Response) => {
      res.sendFile(path.resolve(this.clientPath, 'index.html'));
    });
  }

  start(): Promise<http.Server> {
    return new Promise((resolve, reject) => {
      this.app.listen(this.port)  // Listen on provided port, on all network interfaces.
        .on('listening', () => {
          this.$onReady();
          // resolve();
        })
        .on('error', (error: any) => { this.$onServerInitError(error); reject(error); });
    });
  }

  /**
   * Server ready!
   */
  public $onReady() {
    const url = chalk.blue.underline(`http://localhost:${this.port}/`);
    Logger.log.info(`Serving on ${url}`);
    Logger.log.info("Github org: " + GITHUB_ORGANISATION);
    Logger.log.info("Gitrepo org: " + GITHUB_REPOSITORY);
    Logger.log.info("XML file: " + EA_XMI_FILENAME);

  }

  /**
   * Fatal error occurred during startup of server
   * @param error
   */
  public $onServerInitError(error: any) {
    // handle specific listen errors with friendly messages if configured. Default to the stack-trace.
    Logger.log.error((ERROR_MESSAGES[error.code] ? ERROR_MESSAGES[error.code] : error));
  }
}

(function standalone() {
  Server.Initialize();
})();

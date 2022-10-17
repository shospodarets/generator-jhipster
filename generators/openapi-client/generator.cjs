/**
 * Copyright 2013-2022 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see https://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable consistent-return */
const shelljs = require('shelljs');
const chalk = require('chalk');

const BaseGenerator = require('../base/index.cjs');

const { GENERATOR_OPENAPI_CLIENT } = require('../generator-list.cjs');
const { OpenAPIOptionsNames, OpenAPIDefaultValues } = require('../../jdl/jhipster/openapi-options');
const prompts = require('./prompts.cjs');
const { writeFiles, customizeFiles } = require('./files.cjs');

module.exports = class extends BaseGenerator {
  constructor(args, options, features) {
    super(args, options, features);
    this.option(OpenAPIOptionsNames.REGEN, {
      desc: 'Regenerates all saved clients',
      type: Boolean,
      defaults: OpenAPIDefaultValues.REGEN,
    });
  }

  async _postConstruct() {
    if (!this.fromBlueprint) {
      await this.composeWithBlueprints(GENERATOR_OPENAPI_CLIENT);
    }
  }

  get initializing() {
    return {
      ...super.initializing,
      validateFromCli() {
        this.checkInvocationFromCLI();
      },
      sayHello() {
        // Have Yeoman greet the user.
        this.log(chalk.white('Welcome to the JHipster OpenApi client Sub-Generator'));
      },
      getConfig() {
        this.openApiClients = this.config.get('openApiClients') || {};
        this.loadAppConfig();
        this.loadServerConfig();
      },
    };
  }

  get [BaseGenerator.INITIALIZING]() {
    if (this.delegateToBlueprint) return {};
    return this.initializing;
  }

  get prompting() {
    return {
      askActionType: prompts.askActionType,
      askExistingAvailableDocs: prompts.askExistingAvailableDocs,
      askGenerationInfos: prompts.askGenerationInfos,
    };
  }

  get [BaseGenerator.PROMPTING]() {
    if (this.delegateToBlueprint) return {};
    return this.prompting;
  }

  get configuring() {
    return {
      determineApisToGenerate() {
        this.clientsToGenerate = {};
        if (this.options.regen || this.props.action === 'all') {
          this.clientsToGenerate = this.openApiClients;
        } else if (this.props.action === 'new' || this.props.action === undefined) {
          this.clientsToGenerate[this.props.cliName] = {
            spec: this.props.inputSpec,
            useServiceDiscovery: this.props.useServiceDiscovery,
            generatorName: this.props.generatorName,
          };
        } else if (this.props.action === 'select') {
          this.props.selected.forEach(selection => {
            this.clientsToGenerate[selection.cliName] = selection.spec;
          });
        }
      },

      saveConfig() {
        if (!this.options.regen && this.props.saveConfig) {
          this.openApiClients[this.props.cliName] = this.clientsToGenerate[this.props.cliName];
          this.config.set('openApiClients', this.openApiClients);
        }
      },
    };
  }

  get [BaseGenerator.CONFIGURING]() {
    if (this.delegateToBlueprint) return {};
    return this.configuring;
  }

  get writing() {
    return writeFiles();
  }

  get [BaseGenerator.WRITING]() {
    if (this.delegateToBlueprint) return {};
    return this.writing;
  }

  get postWriting() {
    return customizeFiles();
  }

  get [BaseGenerator.POST_WRITING]() {
    if (this.delegateToBlueprint) return {};
    return this.postWriting;
  }

  get install() {
    return {
      executeOpenApiClient() {
        this.clientPackageManager = this.config.get('clientPackageManager');
        const { stdout, stderr } = shelljs.exec(`${this.clientPackageManager} install`, { silent: this.silent });
        if (stderr) {
          this.log(`Something went wrong while running npm install: ${stdout} ${stderr}`);
        }
        Object.keys(this.clientsToGenerate).forEach(cliName => {
          this.log(chalk.green(`\nGenerating client for ${cliName}`));
          const generatorName = this.clientsToGenerate[cliName].generatorName;
          const { stdout, stderr } = shelljs.exec(`${this.clientPackageManager} run openapi-client:${cliName}`, { silent: this.silent });
          if (!stderr) {
            this.success(`Succesfully generated ${cliName} ${generatorName} client`);
          } else {
            this.log(`Something went wrong while generating client ${cliName}: ${stdout} ${stderr}`);
          }
        });
      },
    };
  }

  get [BaseGenerator.INSTALL]() {
    if (this.delegateToBlueprint) return {};
    return this.install;
  }

  get end() {
    return {
      tearDown() {
        this.log('End of openapi-client generator');
      },
    };
  }

  get [BaseGenerator.END]() {
    if (this.delegateToBlueprint) return {};
    return this.end;
  }
};
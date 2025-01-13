var __awaiter =
  (this && this.__awaiter) ||
  ((thisArg, _arguments, P, generator) => {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P((resolve) => {
            resolve(value);
          });
    }
    return new (P || (P = Promise))((resolve, reject) => {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  });
var __generator =
  (this && this.__generator) ||
  ((thisArg, body) => {
    var _ = {
        label: 0,
        sent: () => {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return (v) => step([n, v]);
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  });
Object.defineProperty(exports, '__esModule', { value: true });
var node_fs_1 = require('node:fs');
var node_path_1 = require('node:path');
var node_url_1 = require('node:url');
var cross_spawn_1 = require('cross-spawn');
var minimist_1 = require('minimist');
var picocolors_1 = require('picocolors');
var prompts_1 = require('prompts');
var blue = picocolors_1.default.blue,
  blueBright = picocolors_1.default.blueBright,
  cyan = picocolors_1.default.cyan,
  green = picocolors_1.default.green,
  greenBright = picocolors_1.default.greenBright,
  magenta = picocolors_1.default.magenta,
  red = picocolors_1.default.red,
  redBright = picocolors_1.default.redBright,
  reset = picocolors_1.default.reset,
  yellow = picocolors_1.default.yellow;
// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606
var argv = (0, minimist_1.default)(process.argv.slice(2), {
  default: { help: false },
  alias: { h: 'help', t: 'template' },
  string: ['_'],
});
var cwd = process.cwd();
// prettier-ignore
var helpMessage =
  'Usage: create-vite [OPTION]... [DIRECTORY]\n\nCreate a new Vite project in JavaScript or TypeScript.\nWith no arguments, start the CLI in interactive mode.\n\nOptions:\n  -t, --template NAME        use a specific template\n\nAvailable templates:\n'
    .concat(yellow('react-ts-biomejs-rsbuild     react'), '\n')
    .concat(green('react-ts-biomejs-vite     react'));
var FRAMEWORKS = [
  {
    name: 'react',
    display: 'React',
    color: cyan,
    variants: [
      {
        name: 'react-rsbuild',
        display: 'react + ts + biomejs + rsbuild',
        color: blue,
      },
      {
        name: 'react-vite',
        display: 'react + ts + biomejs + vite',
        color: blue,
      },
    ],
  },
];
var TEMPLATES = FRAMEWORKS.map((f) => f.variants.map((v) => v.name)).reduce(
  (a, b) => a.concat(b),
  [],
);
var renameFiles = {
  _gitignore: '.gitignore',
};
var defaultTargetDir = 'template-project';
function init() {
  return __awaiter(this, void 0, void 0, function () {
    var argTargetDir,
      argTemplate,
      help,
      targetDir,
      getProjectName,
      result,
      cancelled_1,
      framework,
      overwrite,
      packageName,
      variant,
      root,
      template,
      isReactSwc,
      pkgInfo,
      pkgManager,
      isYarn1,
      customCommand,
      fullCustomCommand,
      _a,
      command,
      args,
      replacedArgs,
      status_1,
      templateDir,
      write,
      files,
      _i,
      _b,
      file,
      pkg,
      cdProjectName;
    var _c;
    return __generator(this, (_d) => {
      switch (_d.label) {
        case 0:
          argTargetDir = formatTargetDir(argv._[0]);
          argTemplate = argv.template || argv.t;
          help = argv.help;
          if (help) {
            console.log(helpMessage);
            return [2 /*return*/];
          }
          targetDir = argTargetDir || defaultTargetDir;
          getProjectName = () =>
            node_path_1.default.basename(node_path_1.default.resolve(targetDir));
          prompts_1.default.override({
            overwrite: argv.overwrite,
          });
          _d.label = 1;
        case 1:
          _d.trys.push([1, 3, , 4]);
          return [
            4 /*yield*/,
            (0, prompts_1.default)(
              [
                {
                  type: argTargetDir ? null : 'text',
                  name: 'projectName',
                  message: reset('Project name:'),
                  initial: defaultTargetDir,
                  onState: (state) => {
                    targetDir = formatTargetDir(state.value) || defaultTargetDir;
                  },
                },
                {
                  type: () =>
                    !node_fs_1.default.existsSync(targetDir) || isEmpty(targetDir)
                      ? null
                      : 'select',
                  name: 'overwrite',
                  message: () =>
                    ''.concat(
                      targetDir === '.'
                        ? 'Current directory'
                        : 'Target directory "'.concat(targetDir, '"'),
                      ' is not empty. Please choose how to proceed:',
                    ),
                  initial: 0,
                  choices: [
                    {
                      title: 'Cancel operation',
                      value: 'no',
                    },
                    {
                      title: 'Remove existing files and continue',
                      value: 'yes',
                    },
                    {
                      title: 'Ignore files and continue',
                      value: 'ignore',
                    },
                  ],
                },
                {
                  type: (_, _a) => {
                    var overwrite = _a.overwrite;
                    if (overwrite === 'no') {
                      throw new Error(''.concat(red('✖'), ' Operation cancelled'));
                    }
                    return null;
                  },
                  name: 'overwriteChecker',
                },
                {
                  type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
                  name: 'packageName',
                  message: reset('Package name:'),
                  initial: () => toValidPackageName(getProjectName()),
                  validate: (dir) => isValidPackageName(dir) || 'Invalid package.json name',
                },
                {
                  type: argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
                  name: 'framework',
                  message:
                    typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate)
                      ? reset(
                          '"'.concat(
                            argTemplate,
                            '" isn\'t a valid template. Please choose from below: ',
                          ),
                        )
                      : reset('Select a framework:'),
                  initial: 0,
                  choices: FRAMEWORKS.map((framework) => {
                    var frameworkColor = framework.color;
                    return {
                      title: frameworkColor(framework.display || framework.name),
                      value: framework,
                    };
                  }),
                },
                {
                  type: (framework) => (typeof framework === 'object' ? 'select' : null),
                  name: 'variant',
                  message: reset('Select a variant:'),
                  choices: (framework) =>
                    framework.variants.map((variant) => {
                      var variantColor = variant.color;
                      return {
                        title: variantColor(variant.display || variant.name),
                        value: variant.name,
                      };
                    }),
                },
              ],
              {
                onCancel: () => {
                  throw new Error(''.concat(red('✖'), ' Operation cancelled'));
                },
              },
            ),
          ];
        case 2:
          result = _d.sent();
          return [3 /*break*/, 4];
        case 3:
          cancelled_1 = _d.sent();
          console.log(cancelled_1.message);
          return [2 /*return*/];
        case 4:
          console.log(result);
          (framework = result.framework),
            (overwrite = result.overwrite),
            (packageName = result.packageName),
            (variant = result.variant);
          root = node_path_1.default.join(cwd, targetDir);
          if (overwrite === 'yes') {
            emptyDir(root);
          } else if (!node_fs_1.default.existsSync(root)) {
            node_fs_1.default.mkdirSync(root, { recursive: true });
          }
          template =
            variant ||
            (framework === null || framework === void 0 ? void 0 : framework.name) ||
            argTemplate;
          isReactSwc = false;
          if (template.includes('-swc')) {
            isReactSwc = true;
            template = template.replace('-swc', '');
          }
          pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
          pkgManager = pkgInfo ? pkgInfo.name : 'npm';
          isYarn1 =
            pkgManager === 'yarn' &&
            (pkgInfo === null || pkgInfo === void 0 ? void 0 : pkgInfo.version.startsWith('1.'));
          customCommand = (
            (_c = FRAMEWORKS.flatMap((f) => f.variants).find((v) => v.name === template)) !==
              null && _c !== void 0
              ? _c
              : {}
          ).customCommand;
          if (customCommand) {
            fullCustomCommand = customCommand
              .replace(/^npm create /, () => {
                // `bun create` uses it's own set of templates,
                // the closest alternative is using `bun x` directly on the package
                if (pkgManager === 'bun') {
                  return 'bun x create-';
                }
                return ''.concat(pkgManager, ' create ');
              })
              // Only Yarn 1.x doesn't support `@version` in the `create` command
              .replace('@latest', () => (isYarn1 ? '' : '@latest'))
              .replace(/^npm exec/, () => {
                // Prefer `pnpm dlx`, `yarn dlx`, or `bun x`
                if (pkgManager === 'pnpm') {
                  return 'pnpm dlx';
                }
                if (pkgManager === 'yarn' && !isYarn1) {
                  return 'yarn dlx';
                }
                if (pkgManager === 'bun') {
                  return 'bun x';
                }
                // Use `npm exec` in all other cases,
                // including Yarn 1.x and other custom npm clients.
                return 'npm exec';
              });
            (_a = fullCustomCommand.split(' ')), (command = _a[0]), (args = _a.slice(1));
            replacedArgs = args.map((arg) => arg.replace('TARGET_DIR', () => targetDir));
            status_1 = cross_spawn_1.default.sync(command, replacedArgs, {
              stdio: 'inherit',
            }).status;
            process.exit(status_1 !== null && status_1 !== void 0 ? status_1 : 0);
          }
          console.log('\nScaffolding project in '.concat(root, '...'));
          templateDir = node_path_1.default.resolve(
            (0, node_url_1.fileURLToPath)(import.meta.url),
            '../..',
            'template-'.concat(template),
          );
          write = (file, content) => {
            var _a;
            var targetPath = node_path_1.default.join(
              root,
              (_a = renameFiles[file]) !== null && _a !== void 0 ? _a : file,
            );
            if (content) {
              node_fs_1.default.writeFileSync(targetPath, content);
            } else {
              copy(node_path_1.default.join(templateDir, file), targetPath);
            }
          };
          files = node_fs_1.default.readdirSync(templateDir);
          for (_i = 0, _b = files.filter((f) => f !== 'package.json'); _i < _b.length; _i++) {
            file = _b[_i];
            write(file);
          }
          pkg = JSON.parse(
            node_fs_1.default.readFileSync(
              node_path_1.default.join(templateDir, 'package.json'),
              'utf-8',
            ),
          );
          pkg.name = packageName || getProjectName();
          write('package.json', ''.concat(JSON.stringify(pkg, null, 2), '\n'));
          if (isReactSwc) {
            setupReactSwc(root, template.endsWith('-ts'));
          }
          cdProjectName = node_path_1.default.relative(cwd, root);
          console.log('\nDone. Now run:\n');
          if (root !== cwd) {
            console.log(
              '  cd '.concat(
                cdProjectName.includes(' ') ? '"'.concat(cdProjectName, '"') : cdProjectName,
              ),
            );
          }
          switch (pkgManager) {
            case 'yarn':
              console.log('  yarn');
              console.log('  yarn dev');
              break;
            default:
              console.log('  '.concat(pkgManager, ' install'));
              console.log('  '.concat(pkgManager, ' run dev'));
              break;
          }
          console.log();
          return [2 /*return*/];
      }
    });
  });
}
function formatTargetDir(targetDir) {
  return targetDir === null || targetDir === void 0
    ? void 0
    : targetDir.trim().replace(/\/+$/g, '');
}
function copy(src, dest) {
  var stat = node_fs_1.default.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    node_fs_1.default.copyFileSync(src, dest);
  }
}
function isValidPackageName(projectName) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName);
}
function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-');
}
function copyDir(srcDir, destDir) {
  node_fs_1.default.mkdirSync(destDir, { recursive: true });
  for (var _i = 0, _a = node_fs_1.default.readdirSync(srcDir); _i < _a.length; _i++) {
    var file = _a[_i];
    var srcFile = node_path_1.default.resolve(srcDir, file);
    var destFile = node_path_1.default.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}
function isEmpty(path) {
  var files = node_fs_1.default.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}
function emptyDir(dir) {
  if (!node_fs_1.default.existsSync(dir)) {
    return;
  }
  for (var _i = 0, _a = node_fs_1.default.readdirSync(dir); _i < _a.length; _i++) {
    var file = _a[_i];
    if (file === '.git') {
      continue;
    }
    node_fs_1.default.rmSync(node_path_1.default.resolve(dir, file), {
      recursive: true,
      force: true,
    });
  }
}
function pkgFromUserAgent(userAgent) {
  if (!userAgent) return undefined;
  var pkgSpec = userAgent.split(' ')[0];
  var pkgSpecArr = pkgSpec.split('/');
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}
function setupReactSwc(root, isTs) {
  editFile(node_path_1.default.resolve(root, 'package.json'), (content) =>
    content.replace(/"@vitejs\/plugin-react": ".+?"/, '"@vitejs/plugin-react-swc": "^3.5.0"'),
  );
  editFile(
    node_path_1.default.resolve(root, 'vite.config.'.concat(isTs ? 'ts' : 'js')),
    (content) => content.replace('@vitejs/plugin-react', '@vitejs/plugin-react-swc'),
  );
}
function editFile(file, callback) {
  var content = node_fs_1.default.readFileSync(file, 'utf-8');
  node_fs_1.default.writeFileSync(file, callback(content), 'utf-8');
}
init().catch((e) => {
  console.error(e);
});

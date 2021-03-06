var childProcess = require('child_process'),
    fs = require('fs'),
    vows = require('vows'),
    assert = require('assert'),
    temp = require('temp');

vows.describe('bin/makeBabelJob test').addBatch({
    'After running makeBabelJob on the test case': {
        topic: function () {
            var babelDir = temp.mkdirSync(),
                cb = this.callback,
                makeBabelJobProcess = childProcess.spawn(__dirname + '/../bin/makeBabelJob', [
                    '--babeldir', babelDir,
                    '--root', __dirname + '/makeBabelJobAndApplyBabelJob/',
                    __dirname + '/makeBabelJobAndApplyBabelJob/index.html',
                    '--locales', 'en,da,de'
                ]),
                buffersByStreamName = {},
                streamNames = ['stdout', 'stderr'];

            streamNames.forEach(function (streamName) {
                buffersByStreamName[streamName] = [];
                makeBabelJobProcess[streamName].on('data', function (chunk) {
                    buffersByStreamName[streamName].push(chunk);
                });
            });

            function getStreamOutputText() {
                var outputText = '';
                streamNames.forEach(function (streamName) {
                    if (buffersByStreamName[streamName].length > 0) {
                        outputText += '\n' + streamName.toUpperCase() + ': ' + Buffer.concat(buffersByStreamName[streamName]).toString('utf-8') + '\n';
                    }
                });
                return outputText;
            }

            makeBabelJobProcess.on('exit', function (exitCode) {
                if (exitCode) {
                    cb(new Error("The makeBabelJob process ended with a non-zero exit code: " + exitCode + getStreamOutputText()));
                } else {
                    cb(null, babelDir);
                }
            });
        },
        'there should be a .txt for each target locale in babelDir': function (babelDir) {
            assert.deepEqual(fs.readdirSync(babelDir).sort(),
                             ['da.txt', 'de.txt', 'en.txt']);
        },
        'en.txt should have the correct contents': function (babelDir) {
            var lines = fs.readFileSync(babelDir + '/en.txt', 'utf-8').split(/\n/);
            assert.equal(lines.shift(), 'alreadyPartiallyTranslatedKey[theNotYetTranslatedOne]=yup');
            assert.equal(lines.shift(), 'arrayvalue[0]=5');
            assert.equal(lines.shift(), 'arrayvalue[1]=items');
            assert.equal(lines.shift(), 'arrayvalue[2]=in');
            assert.equal(lines.shift(), 'arrayvalue[3]=an');
            assert.equal(lines.shift(), 'arrayvalue[4]=array');
            assert.equal(lines.shift(), 'keywithplaceholdersinhtml=Key with {0} placeholders in HTML, English');
            assert.equal(lines.shift(), 'objectvalue[key1]=value1');
            assert.equal(lines.shift(), 'objectvalue[key2]=value2');
            assert.equal(lines.shift(), 'objectvaluewithsomemissingkeysinthestructure[foo][bar]=baz');
            assert.equal(lines.shift(), 'objectvaluewithsomemissingkeysinthestructure[foo][quux]=blah');
            assert.equal(lines.shift(), 'simplekeyinhtml=Simple key in HTML, English');
            assert.equal(lines.shift(), 'simplekeyinhtmlattribute=Simple key in HTML attribute, English');
            assert.equal(lines.shift(), 'simplekeyinknockoutjstemplate=Simple key in a Knockout.js template');
            assert.equal(lines.shift(), 'stringvalue=value');
            assert.equal(lines.shift(), 'withexistingkeys=the English value');
            assert.equal(lines.shift(), '');
        },
        'da.txt should have the correct contents': function (babelDir) {
            var lines = fs.readFileSync(babelDir + '/da.txt', 'utf-8').split(/\n/);
            assert.equal(lines.shift(), 'alreadyPartiallyTranslatedKey[theNotYetTranslatedOne]=');
            assert.equal(lines.shift(), 'arrayvalue[0]=');
            assert.equal(lines.shift(), 'arrayvalue[1]=');
            assert.equal(lines.shift(), 'arrayvalue[2]=');
            assert.equal(lines.shift(), 'arrayvalue[3]=');
            assert.equal(lines.shift(), 'arrayvalue[4]=');
            assert.equal(lines.shift(), 'keywithplaceholdersinhtml=');
            assert.equal(lines.shift(), 'objectvalue[key1]=');
            assert.equal(lines.shift(), 'objectvalue[key2]=');
            assert.equal(lines.shift(), 'objectvaluewithsomemissingkeysinthestructure[foo][bar]=baz');
            assert.equal(lines.shift(), 'objectvaluewithsomemissingkeysinthestructure[foo][quux]=');
            assert.equal(lines.shift(), 'simplekeyinhtml=');
            assert.equal(lines.shift(), 'simplekeyinhtmlattribute=');
            assert.equal(lines.shift(), 'simplekeyinknockoutjstemplate=');
            assert.equal(lines.shift(), 'stringvalue=');
            assert.equal(lines.shift(), 'withexistingkeys=the Danish value');
            assert.equal(lines.shift(), '');
        },
        'de.txt should have the correct contents': function (babelDir) {
            var lines = fs.readFileSync(babelDir + '/de.txt', 'utf-8').split(/\n/);
            assert.equal(lines.shift(), 'alreadyPartiallyTranslatedKey[theNotYetTranslatedOne]=');
            assert.equal(lines.shift(), 'arrayvalue[0]=');
            assert.equal(lines.shift(), 'arrayvalue[1]=');
            assert.equal(lines.shift(), 'arrayvalue[2]=');
            assert.equal(lines.shift(), 'arrayvalue[3]=');
            assert.equal(lines.shift(), 'arrayvalue[4]=');
            assert.equal(lines.shift(), 'keywithplaceholdersinhtml=');
            assert.equal(lines.shift(), 'objectvalue[key1]=');
            assert.equal(lines.shift(), 'objectvalue[key2]=');
            assert.equal(lines.shift(), 'objectvaluewithsomemissingkeysinthestructure[foo][bar]=');
            assert.equal(lines.shift(), 'objectvaluewithsomemissingkeysinthestructure[foo][quux]=');
            assert.equal(lines.shift(), 'simplekeyinhtml=');
            assert.equal(lines.shift(), 'simplekeyinhtmlattribute=');
            assert.equal(lines.shift(), 'simplekeyinknockoutjstemplate=');
            assert.equal(lines.shift(), 'stringvalue=');
            assert.equal(lines.shift(), 'withexistingkeys=');
            assert.equal(lines.shift(), '');
        },
        'then add translations to da.txt, duplicate the test case and run applyBabelJob on it': {
            topic: function (babelDir) {
                var cb = this.callback,
                    tmpTestCaseCopyDir = temp.mkdirSync(),
                    daTxtLines = [
                        'alreadyPartiallyTranslatedKey[theNotYetTranslatedOne]=nowItIsTranslated',
                        'simplekeyinknockoutjstemplate=Simpel nøgle i en Knockout.js-skabelon',
                        'stringvalue=the Danish stringvalue',
                        'arrayvalue[0]=5',
                        'arrayvalue[1]=elementer',
                        'arrayvalue[2]=i',
                        'arrayvalue[3]=et',
                        'arrayvalue[4]=array',
                        'objectvalue[key1]=værdi1',
                        'objectvalue[key2]=værdi2',
                        'objectvaluewithsomemissingkeysinthestructure[foo][bar]=bazbaz',
                        'objectvaluewithsomemissingkeysinthestructure[foo][quux]=fuzfuz',
                        'withexistingkeys=den opdaterede danske værdi',
                        'simplekeyinhtml=Simpel nøgle på dansk',
                        'simplekeyinhtmlattribute=Simpel nøgle i HTML-attribut på dansk',
                        'keywithplaceholdersinhtml=Nøgle med pladsholdere på dansk'
                    ],
                    copyCommand = "cp '" + __dirname + "/makeBabelJobAndApplyBabelJob'/* " + tmpTestCaseCopyDir;
                fs.writeFileSync(babelDir + '/da.txt', daTxtLines.join("\n"), 'utf-8');
                childProcess.exec(copyCommand, function (err, stdout, stderr) {
                    if (err) {
                        return cb(new Error(copyCommand + " failed: STDERR:" + stderr + "\nSTDOUT:" + stdout));
                    }
                    var applyBabelJobProcess = childProcess.spawn(__dirname + '/../bin/applyBabelJob', [
                        '--babeldir', babelDir,
                        '--root', tmpTestCaseCopyDir,
                        '--locales', 'en,da,de',
                        tmpTestCaseCopyDir + '/index.html'
                    ]);
                    applyBabelJobProcess.on('exit', function (exitCode) {
                        if (exitCode) {
                            cb(new Error("The applyBabelJob process ended with a non-zero exit code: " + exitCode));
                        } else {
                            cb(null, tmpTestCaseCopyDir);
                        }
                    });
                });
            },
            'thething.i18n should be updated with the translations': function (tmpTestCaseCopyDir) {
                assert.deepEqual(JSON.parse(fs.readFileSync(tmpTestCaseCopyDir + '/thething.i18n')), {
                    stringvalue: {
                        en: 'value',
                        da: 'the Danish stringvalue',
                        de: ''
                    },
                    arrayvalue: {
                        en: [5, 'items', 'in', 'an', 'array'],
                        da: [5, 'elementer', 'i', 'et', 'array'],
                        de: ['', '', '', '', '']
                    },
                    objectvalue: {
                        en: {
                            key1: 'value1',
                            key2: 'value2'
                        },
                        da: {
                            key1: 'værdi1',
                            key2: 'værdi2'
                        },
                        de: {
                            key1: '',
                            key2: ''
                        }
                    },
                    objectvaluewithsomemissingkeysinthestructure: {
                        da: {
                            foo: { quux: 'fuzfuz', bar: 'bazbaz' }
                        },
                        de: {
                            foo: { quux: '', bar: '' }
                        },
                        en: {
                            foo: { quux: 'blah', bar: 'baz' }
                        }
                    },
                    withexistingkeys: {
                        en: 'the English value',
                        da: 'den opdaterede danske værdi',
                        de: ''
                    },
                    simplekeyinhtml: {
                        en: 'Simple key in HTML, English',
                        da: 'Simpel nøgle på dansk',
                        de: ''
                    },
                    simplekeyinhtmlattribute: {
                        en: 'Simple key in HTML attribute, English',
                        da: 'Simpel nøgle i HTML-attribut på dansk',
                        de: ''
                    },
                    keywithplaceholdersinhtml: {
                        en: 'Key with {0} placeholders in HTML, English',
                        da: 'Nøgle med pladsholdere på dansk',
                        de: ''
                    },
                    simplekeyinknockoutjstemplate: {
                        en: 'Simple key in a Knockout.js template',
                        da: 'Simpel nøgle i en Knockout.js-skabelon',
                        de: ''
                    },
                    alreadyPartiallyTranslatedKey: {
                        en: {
                            theTranslatedOne: 'yep',
                            theNotYetTranslatedOne: 'yup'
                        },
                        da: {
                            theTranslatedOne: 'ja',
                            theNotYetTranslatedOne: 'nowItIsTranslated'
                        },
                        de: {
                            theTranslatedOne: 'Ja',
                            theNotYetTranslatedOne: ''
                        }
                    }
                });
            }
       }
   }
})['export'](module);

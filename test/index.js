var path = require('path'),
    Entity = require('bemhint/lib/entity'),
    q = require('q'),
    qfs = require('q-io/fs'),
    sinon = require('sinon'),
    plugin = require('../lib/index');

describe('bemhint-fs-naming', function() {
    var config = { isExcludedPath: sinon.stub().returns(false) },
        sandbox = sinon.sandbox.create(),
        createEntity = function(notation, path) {
            var entity = new Entity([{ entity: notation, path: path }]);

            sandbox.spy(entity, 'addError');

            return entity;
        },
        makeEntityDirContain = function(files) {
            sandbox.stub(qfs, 'list').returns(q(files));
        },
        treatSubjectAsDirectory = function() {
            sandbox.stub(qfs, 'stat').returns(q({ isFile: function() { return false; } }));
        },
        treatSubjectAsFile = function() {
            sandbox.stub(qfs, 'stat').returns(q({ isFile: function() { return true; } }));
        };

    afterEach(function() {
        sandbox.restore();
    });

    it('should notify of file not in a BEM notation', function() {
        var blockPath = 'desktop.blocks/block',
            blockName = 'block.js',
            nonBEMFilename = 'non-bem-name-file.js',
            entity = createEntity({ block: 'block' }, path.join(blockPath, blockName));

        makeEntityDirContain([blockName, nonBEMFilename]);
        treatSubjectAsFile();

        return plugin.forEntities([entity], config).then(function() {
            entity.addError.should.have.been.calledWith({
                msg: 'File in not in BEM notation',
                path: path.join(blockPath, nonBEMFilename)
            });
        });
    });

    it('should notify of directories not in a BEM notation', function() {
        var blockPath = 'desktop.blocks/block',
            blockName = 'block.js',
            nonBEMDirectory = 'non-bem-directory',
            entity = createEntity({ block: 'block' }, path.join(blockPath, blockName));

        makeEntityDirContain([blockName, nonBEMDirectory]);
        treatSubjectAsDirectory();

        return plugin.forEntities([entity], config).then(function() {
            entity.addError.should.have.been.calledWith({
                msg: 'Dir is not in BEM notation',
                path: path.join(blockPath, nonBEMDirectory)
            });
        });
    });

    it('should ignore exluded files not in BEM notation', function() {
        var blockPath = 'desktop.blocks/block',
            blockName = 'block.js',
            nonBEMFilename = 'non-bem-name-file.js',
            entity = createEntity({ block: 'block' }, path.join(blockPath, blockName)),
            config = { isExcludedPath: function(file) { return file.indexOf(nonBEMFilename) !== -1; } };

        makeEntityDirContain([blockName, nonBEMFilename]);
        treatSubjectAsFile();

        return plugin.forEntities([entity], config).then(function() {
            entity.addError.should.not.have.been.called;
        });
    });
});

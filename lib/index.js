var path = require('path'),
    bemNaming = require('bem-naming'),
    _ = require('lodash'),
    q = require('q'),
    qfs = require('q-io/fs');

exports.forEntities = function(entities, config) {
    var entitiesKeys = entities.map(formatEntityKey);

    return _(entities)
        .map(checkEntity_)
        .thru(q.all)
        .value();

    function checkEntity_(entity) {
        var techsPaths = _.map(entity.getTechs(), 'path'),
            entityDirname = entity.getDirName();

        return qfs.list(entityDirname)
            .then(filterExtraPaths_)
            .then(addErrors_);

        function filterExtraPaths_(files) {
            return _(files)
                .map(function(file) {
                    return path.join(entityDirname, file);
                })
                .reject(config.isExcludedPath.bind(config))
                .difference(techsPaths)
                .value();
        }

        function addErrors_(files) {
            return _(files)
                .map(function(file) {
                    return qfs.stat(file)
                        .then(function(stat) {
                            return stat.isFile();
                        });
                })
                .thru(q.all)
                .value()
                .then(_.zipObject.bind(null, files))
                .then(function(files) {
                    _.forEach(files, function(isFile, file) {
                        isFile ? handleExtraFile_(file) : handlePossibleExtraDir_(file);
                    })
                });
        }

        function handleExtraFile_(file) {
            entity.addError({msg: 'File in not in BEM notation', path: file});
        }

        function handlePossibleExtraDir_(dir) {
            var dirKey = formatEntityKey(entity) + path.basename(dir);
            if(_.includes(entitiesKeys, dirKey)) {
                return;
            }

            if(isValidBemDir(dir, entity)) {
                entity.addError({msg: 'Empty BEM entity', path: dir});
                return;
            }

            entity.addError({msg: 'Dir is not in BEM notation', path: dir});
        }
    }
};

function isValidBemDir(dir, entity) {
    var entityNotation = entity.getNotation(),
        dirNotation = bemNaming.parse(bemNaming.stringify(entityNotation) + path.basename(dir));

    return dirNotation && bemNaming.typeOf(dirNotation) !== bemNaming.typeOf(entityNotation);
}

function formatEntityKey(entity) {
    return entity.getLevel() + '#' + bemNaming.stringify(entity.getNotation());
}

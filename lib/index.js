var path = require('path'),
    bemNaming = require('bem-naming'),
    _ = require('lodash'),
    q = require('q'),
    qfs = require('q-io/fs');

exports.forEntities = function(entities, config) {
    var allTechsPaths = _(entities).map(getTechsPaths).flatten().value();

    return _(entities)
        .map(checkEntity_)
        .thru(q.all)
        .value();

    function checkEntity_(entity) {
        var techsPaths = getTechsPaths(entity),
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
                .filter(function(file) {
                    return !_.includes(allTechsPaths, file);
                })
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
            entity.addError({msg: 'File is not in BEM notation', path: file});
        }

        function handlePossibleExtraDir_(dir) {
            !isValidBemDir(dir, entity) && entity.addError({msg: 'Dir is not in BEM notation', path: dir});
        }
    }
};

function getTechsPaths(entity) {
    return _.map(entity.getTechs(), 'path');
}

function isValidBemDir(dir, entity) {
    var entityNotation = entity.getNotation(),
        dirNotation = bemNaming.parse(bemNaming.stringify(entityNotation) + path.basename(dir));

    return dirNotation && bemNaming.typeOf(dirNotation) !== bemNaming.typeOf(entityNotation);
}

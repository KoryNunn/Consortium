var crel = require('crel'),
    cpjax = require('cpjax'),
    doc = require('doc-js'),
    iconCache = {};

module.exports = function(fastn, component, type, settings, children){
    settings.tagName = 'i';

    component.extend('_generic', settings, children);

    function setImage(svg){
        if(!component.element){
            return;
        }

        component.element.innerHTML = svg;
    }

    function updateName(){
        var name = component.name();

        if(!component.element || !name){
            return;
        }

        var relativePath = 'icons/' + name + '.svg';
        var path = window.sourcePath + relativePath;

        if(path in iconCache){
            if(typeof iconCache[path] === 'function'){
                iconCache[path](setImage);
            }else{
                setImage(iconCache[path]);
            }
            return;
        }

        iconCache[path] = function(callback){
            iconCache[path].callbacks.push(callback);
        };
        iconCache[path].callbacks = [];
        iconCache[path](setImage);

        cpjax(relativePath, function(error, svg){
            if(error){
                setImage(null);
                return;
            }

            iconCache[path].callbacks.forEach(function(callback){
                callback(svg);
            });

            iconCache[path] = svg;
        });
    }

    component.setProperty('name', fastn.property('', updateName));

    return component;
};
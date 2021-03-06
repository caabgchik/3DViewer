importScripts('../js/turfjs/turf.min.js');


function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}


function bufferExistingRoads(inputroads) {
    var streets = [];
    for (var x = 0; x < inputroads.features.length; x++) {
        var linestring = inputroads.features[x];
        var street = turf.buffer(linestring, 0.0075, 'kilometers');
        if (street['type'] === "Feature") {
            streets.push(street);
        }
    }
    return { "type": "FeatureCollection", "features": streets }
}

function generatePolicyFeatures(curFeat) {
    var curFeatprops = curFeat.properties;
    const elevationoffset = 10;

    function getCW(d) {
        return d > 10000000 ? 1 :
            d > 6000000 ? 0.75 :
            d > 5000000 ? 0.5 :
            d > 3000000 ? 0.3 :
            d > 2000000 ? 0.15 :
            d > 1000000 ? 0.08 :
            0.04;
    }
    var policyFeats = [];
    var fe = turf.bbox(curFeat);
    var area = Math.round(turf.area(curFeat));
    var cw = getCW(area);
    var unit = 'kilometers';
    var dJSON = {
        "type": "FeatureCollection",
        "features": [curFeat]
    };
    // make the grid of 50 meter points
    var grd = turf.pointGrid(fe, cw, unit);
    var pW = turf.within(grd, dJSON);
    var pwLen = pW.features.length;
    var height = elevationoffset + 0.01;
    var prop = {
        "roofColor": curFeatprops.color,
        "height": height,
        "isStreet": 0,
        "sysname": curFeatprops.sysname
    }
    for (var l1 = 0; l1 < pwLen; l1++) {
        var curptwithin = pW.features[l1];
        var bufFeat = turf.buffer(curptwithin, 0.0075, 'kilometers');
        bufFeat.properties = prop;
        policyFeats.push(bufFeat);
    }
    return policyFeats;
}

function generateFinal3DGeoms(constraintedModelDesigns, genstreets, existingroads) {

    const elevationoffset = 10;
    var whiteListedSysName = ['HDH', 'LDH', 'IND', 'COM', 'COMIND', 'HSG', 'MXD'];
    var finalGJFeats = [];
    // get the center of the design so that the map once returned can be recentered.
    var centerPt = turf.center(constraintedModelDesigns);
    var lat = centerPt.geometry.coordinates[1];
    var lng = centerPt.geometry.coordinates[0];
    // iterate over the features.
    var curFeats = constraintedModelDesigns.features;
    var flen = curFeats.length;
    var fullproc = flen;
    var counter = 0;
    for (var h = 0; h < flen; h++) {
        // for every feature , create a point grid.
        var curFeat = curFeats[h];
        // console.log(JSON.stringify(curFeat));
        var curFeatSys = curFeat.properties.sysname;
        const units = 'kilometers';
        const elevationoffset = 10;
        // if it is a line then simply buffer it and paint it black with a small height
        if (curFeat.geometry.type === "LineString") {
            f = turf.buffer(curFeat, 0.005, 'kilometers');
            if (f['type'] === "Feature") {
                f = { "type": "FeatureCollection", "features": [f] }
            }
            var linefeats = f.features;
            var linefeatlen = linefeats.length;
            for (var x1 = 0; x1 < linefeatlen; x1++) {
                curlineFeat = linefeats[x1];
                var height = elevationoffset + 0.5;
                curlineFeat.properties = {
                    "color": curFeat.properties.color,
                    "roofColor": curFeat.properties.color,
                    "isStreet": 0,
                    "sysname": curFeat.properties.sysname,
                    "height": height
                };

                finalGJFeats.push(curlineFeat);
            }
        } else if (curFeat.geometry.type === "Polygon") {

            var featProps = curFeat.properties;
            if (whiteListedSysName.indexOf(curFeatSys) >= 0) { // system is whitelisted
                if (curFeat.properties.areatype === 'project') {
                    //100 meter cell width
                    if ((featProps.sysname === 'HDH') || (featProps.sysname === 'HSNG') || (featProps.sysname === 'HSG')) {
                        const heights = [36, 60, 90]; // in meters 
                        var height = elevationoffset + heights[Math.floor(Math.random() * heights.length)];
                        var props = {
                            "height": height,
                            "color": "#d0d0d0",
                            "roofColor": featProps.color,
                            "sysname": featProps.sysname,
                            "isStreet": 0
                        };
                        var cFeat = curFeat;
                        cFeat.properties = props;
                        finalGJFeats.push(cFeat);

                    } else if (featProps.sysname === 'MXD') {
                        const mxdheights = [9, 12, 8, 11]; // in meters 
                        var height = elevationoffset + mxdheights[Math.floor(Math.random() * mxdheights.length)];
                        var props = {
                            "height": height,
                            "color": "#d0d0d0",
                            "roofColor": featProps.color,
                            "sysname": featProps.sysname,
                            "isStreet": 0
                        };
                        var cFeat = curFeat;
                        cFeat.properties = props;
                        finalGJFeats.push(cFeat);

                    } else if (featProps.sysname === 'LDH') {

                        const ldhheights = [1, 2, 3]; // in meters 
                        var height = elevationoffset + ldhheights[Math.floor(Math.random() * ldhheights.length)];
                        var props = {
                            "height": height,
                            "color": "#d0d0d0",
                            "roofColor": featProps.color,
                            "sysname": featProps.sysname,
                            "isStreet": 0
                        };
                        var cFeat = curFeat;
                        cFeat.properties = props;
                        finalGJFeats.push(cFeat);

                    } else if ((featProps.sysname === 'COM')) {

                        const comHeights = [14, 25, 30, 22, 28];
                        var height = elevationoffset + comHeights[Math.floor(Math.random() * comHeights.length)];
                        var props = {
                            "height": height,
                            "color": "#d0d0d0",
                            "roofColor": featProps.color,
                            "sysname": featProps.sysname,
                            "isStreet": 0
                        };
                        var cFeat = curFeat;
                        cFeat.properties = props;
                        finalGJFeats.push(cFeat);

                    } else if (featProps.sysname === 'COMIND') {

                        var labHeights = [10, 15];
                        var height = elevationoffset + labHeights[Math.floor(Math.random() * labHeights.length)];
                        var props = {
                            "height": height,
                            "color": "#d0d0d0",
                            "roofColor": featProps.color,
                            "sysname": featProps.sysname,
                            "isStreet": 0
                        };
                        var cFeat = curFeat;
                        cFeat.properties = props;
                        finalGJFeats.push(cFeat);

                    }
                } else if (curFeat.properties.areatype === 'policy') { // whitelisted policy
                    var policyF = generatePolicyFeatures(curFeat);
                    for (var pf = 0; pf < policyF.length; pf++) {
                        finalGJFeats.push(policyF[pf]);
                    }
                }

            }
            // for non white listed systems that are buildings
            else if ((featProps.systag === 'Large buildings, Industry, commerce') && (featProps.areatype === 'project')) {
                var labHeights = [10, 15];
                var height = elevationoffset + labHeights[Math.floor(Math.random() * labHeights.length)];
                var props = {
                    "height": height,
                    "color": "#d0d0d0",
                    "roofColor": featProps.color,
                    "sysname": featProps.sysname,
                    "isStreet": 0
                };
                var cFeat = curFeat;
                cFeat.properties = props;
                finalGJFeats.push(cFeat);



            } else if ((featProps.systag === 'Small buildings, low density housing') && (featProps.areatype === 'project')) {
                var smbHeights = [2, 3, 5, 6, 7, 10];
                var height = elevationoffset + smbHeights[Math.floor(Math.random() * smbHeights.length)];
                var props = {
                    "height": height,
                    "color": "#d0d0d0",
                    "roofColor": featProps.color,
                    "sysname": featProps.sysname,
                    "isStreet": 0
                };
                var cFeat = curFeat;
                cFeat.properties = props;
                finalGJFeats.push(cFeat);


            } else { // all systems that not buildings
                if (curFeat.properties.areatype === 'project') {
                    var height = elevationoffset + 0.01;
                    var prop = {
                        "roofColor": curFeat.properties.color,
                        "isStreet": 0,
                        "height": height,
                        "sysname": curFeat.properties.sysname
                    }
                    curFeat.properties = prop;
                    finalGJFeats.push.apply(finalGJFeats, [curFeat]);
                } else if (curFeat.properties.areatype === 'policy') {
                    var policyF = generatePolicyFeatures(curFeat);
                    for (var pf = 0; pf < policyF.length; pf++) {
                        finalGJFeats.push(policyF[pf]);
                    }
                }
            }

        }
        counter += 1;
        self.postMessage({
            'percentcomplete': parseInt((100 * counter) / fullproc),
            'mode': 'status',
        });
    }
    var fpolygons = {
        "type": "FeatureCollection",
        "features": finalGJFeats
    };
    // console.log(JSON.stringify(fpolygons));
    self.postMessage({
        'polygons': JSON.stringify(fpolygons),
        'center': JSON.stringify([lat, lng])
    });

}

function constrainFeatures(allFeaturesList, selectedsystems) {
    // constrain output ot only features in the list. 
    var cFeats = allFeaturesList.features;
    var constraintedFeatures = { "type": "FeatureCollection", "features": [] };
    var featlen = cFeats.length;
    for (var d = 0; d < featlen; d++) {
        var curfeatprop = cFeats[d].properties;
        var curFeatSys = curfeatprop.sysname;
        if (selectedsystems.indexOf(curFeatSys) > -1) {
            constraintedFeatures.features.push(cFeats[d]);
        }
    }
    return constraintedFeatures
}

function generate3DGeoms(allFeaturesList, selectedsystems) {
    var allFeaturesList = JSON.parse(allFeaturesList);
    var selectedsystems = JSON.parse(selectedsystems);
    // console.log(JSON.stringify(existingroads));

    var threeDOutput;
    if (selectedsystems.length > 0) {
        var constraintedFeatures = constrainFeatures(allFeaturesList, selectedsystems);
        threeDOutput = generateFinal3DGeoms(constraintedFeatures);
    } else {
        threeDOutput = generateFinal3DGeoms(allFeaturesList);
    }
}

self.onmessage = function(e) {
    generate3DGeoms(e.data.allFeaturesList, e.data.selectedsystems);
}
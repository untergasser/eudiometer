// Copyright 2018 by A. Untergasser, all rights reserved.

// Temperature in Celsius
var temp = 20;
var setTemp = 20;
var deltaTemp = 0;
var heatDelay = 0;

// Gas in Tube
var hydrogen = 0.01;
var oxygen = 0.01;  // oxygen is chlorine, to lazy to change!
var water = 0.01;  //  water is hydrogenchlorine, to lazy to change!
var visWater;

// Gas on its way
var gasHydorgen = 0;
var gasOxygen = 0;
var allBubbles = [];
// [x,y,dir,gas type, vol, id]

// The gas valves open/close
var hydrogenValve = 0;
var oxygenValve = 0;
var exitValve = 0;

// Required for explosion animation
var sparkTime = 0;
var explodeVol = 0;
var bubbleIdCount = 0;
var fps = 0;

// The svg elements
var elm_gas;
var elm_ignite_button;
var elm_ignite_button_l;
var elm_ignite_spark;
var elm_valve_exit;
var elm_valve_hydrogen;
var elm_valve_oxygen;
var elm_bubbles;
var elm_boom_sound;
var elm_heating = null;
var elm_heat_temp;
var elm_heat_setTemp;
var elm_heat_upup;
var elm_heat_up;
var elm_heat_down;
var elm_heat_downdown;

// Handle the svg element
var svgDoc;
var svgFrame = document.getElementById("svgFrame");

// Upon svg load connect the elements
svgFrame.addEventListener("load",function(){
    // Connect the elements
    svgDoc = svgFrame.contentDocument;
    elm_gas = svgDoc.getElementById('gasfill');
    elm_ignite_button = svgDoc.getElementById("electricIgnite");
    elm_ignite_button_l = svgDoc.getElementById("electricFlash");
    elm_ignite_spark = svgDoc.getElementById('spark');
    elm_valve_exit = svgDoc.getElementById("exitValve");
    elm_valve_hydrogen = svgDoc.getElementById("hydogenValve");
    elm_valve_oxygen = svgDoc.getElementById("oxygenValve");
    elm_bubbles = svgDoc.getElementById("allBubbles");
    elm_boom_sound = document.getElementById("boomSound");
    // Only on mercury eudiometer
    elm_heating = svgDoc.getElementById("cableHeater");
    if (elm_heating) {
        elm_heat_temp = svgDoc.getElementById("heatingCurTemp");
        elm_heat_setTemp = svgDoc.getElementById("heatingSetTemp");
        elm_heat_upup = svgDoc.getElementById("heatingUpUp");
        elm_heat_up = svgDoc.getElementById("heatingUp");
        elm_heat_down = svgDoc.getElementById("heatingDown");
        elm_heat_downdown = svgDoc.getElementById("heatingDownDown");
    }
    
    // Resize svg to fit in
    var w = window.innerWidth;
    var h = window.innerHeight - 150;
    var cw = Math.round(h / 3 * 4);
    var ch = h;
    if (cw > w) {
        cw = w;
        ch = Math.round(w / 4 * 3);
    }
    svgFrame.setAttribute('width', cw);
    svgFrame.setAttribute('height', ch);
    
    // Attach the event listeners
    elm_valve_exit.addEventListener("click", toggleExit, false);
    elm_valve_hydrogen.addEventListener("click", toggleHydrogen, false);
    elm_valve_oxygen.addEventListener("click", toggleOxygen, false);
    elm_ignite_button.addEventListener("click", igniteGas, false);
    elm_ignite_button_l.addEventListener("click", igniteGas, false);
    // Only on mercury eudiometer
    if (elm_heating) {
        elm_heat_upup.addEventListener("click", tempUpUp, false);
        elm_heat_up.addEventListener("click", tempUp, false);
        elm_heat_down.addEventListener("click", tempDown, false);
        elm_heat_downdown.addEventListener("click", tempDownDown, false);
    }

    // Startup loop
    document.body.style.backgroundColor = "#d9d9d9";
    running();
    setTimeout(doFps, 1000);
});

// Main function calculating the animation
function running() {
    if (elm_heating) {
        elm_heat_setTemp.textContent = setTemp.toFixed(1) + "°C";
        heatDelay++;
        if (heatDelay == 7) {
            heatDelay = 0;
            if (temp + 0.1 < setTemp) {
                elm_heating.style.stroke = "#f0aa2d";
                deltaTemp += 0.2;
                if (deltaTemp < -0.3) {
                    deltaTemp += 0.3;
                }
            }
            if (temp - 0.1 > setTemp) {
                elm_heating.style.stroke = "#000000";
                deltaTemp -= 0.3;
            }
            if (deltaTemp > 1.5) {
                deltaTemp = 1.5;
            }
            if (deltaTemp < -3.0) {
                deltaTemp = -3.0;
            }
            temp += deltaTemp;
            elm_heat_temp.textContent = temp.toFixed(1) + "°C";
        }
    }
    if (temp > 100) {
        visWater = water;
    } else {
        visWater = 0.01;
    }
    if (oxygenValve == 1) {
        gasOxygen += 0.01;
    }
    if (hydrogenValve == 1) {
        gasHydorgen += 0.01;
    }
    if (gasOxygen > (0.05 + Math.random()/10)) {
        allBubbles.push([ 8.8, 208.7, "L", "O", gasOxygen, null]);
        gasOxygen = 0;
    }
    if (gasHydorgen > (0.05 + Math.random()/10)) {
        allBubbles.push([ 5, 207.5, "R", "H", gasHydorgen, null]);
        gasHydorgen = 0;
    }
    for (var i = 0 ; i < allBubbles.length ; i++) {
        allBubbles[i][1] -= 1.3 + Math.random() * 0.4;
        if (Math.random() < 0.05) {
            if (allBubbles[i][2] == "R") {
                allBubbles[i][2] = "L";
            } else {
                allBubbles[i][2] = "R";
            }
        }
        if (allBubbles[i][0] < 3) {
            allBubbles[i][2] = "R";
        }
        if (allBubbles[i][0] > 12) {
            allBubbles[i][2] = "L";
        }
        if (allBubbles[i][2] == "R") {
            allBubbles[i][0] += Math.random() * 0.4;
        } else {
            allBubbles[i][0] -= Math.random() * 0.4;
        }
        
        // bubble fuses to top bubble
        if ((allBubbles[i][1] < getVolume() * 10) && (allBubbles[i][4] > 0)) {
            if (getVolume() < 20) {
                if (allBubbles[i][3] == "H") {
                    hydrogen += allBubbles[i][4];
                } else {
                    oxygen += allBubbles[i][4];
                }
            }
            allBubbles[i][4] = 0;
            svgDoc.getElementById(allBubbles[i][5]).remove();
            allBubbles[i][5] = null;
        }
        if (allBubbles[i][4] > 0) {
            if (allBubbles[i][5] == null) {
                var newElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", 'circle');
                allBubbles[i][5] = "bubbleNr" + bubbleIdCount++;
                newElement.setAttribute("id", allBubbles[i][5]);
                newElement.setAttribute("r", 1 + allBubbles[i][4] * 5);
                newElement.setAttribute("cx", allBubbles[i][0]);
                newElement.setAttribute("cy", allBubbles[i][1]);
                if (allBubbles[i][2] == "L") {
                    newElement.style.fill = "#ffffff";
                } else {
                    newElement.style.fill = "#e6ffcc";
                }
                newElement.style.fill.stroke = "none";
                elm_bubbles.appendChild(newElement);
            } else {
                var bb = svgDoc.getElementById(allBubbles[i][5]);
                bb.setAttributeNS(null, "cx", allBubbles[i][0]);
                bb.setAttributeNS(null, "cy", allBubbles[i][1]);
            }
        }
    }
    for (var i = allBubbles.length - 1 ; i > -1 ; i--) {
        if (allBubbles[i][4] == 0) {
            allBubbles.splice(i, 1);
        }
    }
    if (exitValve == 1) {
        hydrogen -= 0.03 * hydrogen / (hydrogen + oxygen + water);
        oxygen -= 0.03 * oxygen / (hydrogen + oxygen + water);
        water -= 0.03 * water / (hydrogen + oxygen + water);
    }
    if (oxygen < 0) {
        oxygen = 0.01;
    }
    if (hydrogen < 0) {
        hydrogen = 0.01;
    }
    if (water < 0) {
        water = 0.01;
    }
    if (sparkTime > -1) {
        sparkTime--;
        if (sparkTime == 0) {
            elm_ignite_spark.setAttributeNS(null, 'display', 'none');
        }
    }
    if (explodeVol > getVolume()) {
        elm_gas.style.fill = '#ffff00';
        elm_gas.setAttributeNS(null, 'height', explodeVol * 10);
        explodeVol -= 5;
    } else {
        var clFraction = oxygen / (hydrogen + oxygen + water);
        var redP = 255 - Math.floor(25 * clFraction);
        var blueP = 255 - Math.floor(51 * clFraction);
        elm_gas.style.fill = 'rgb(' + redP + ', 255, ' + blueP + ')';
        elm_gas.setAttributeNS(null, 'height', getVolume() * 10);
        explodeVol = 0;
    }
    fps++;
    setTimeout(running, 40);
}

function getVolume() {
    var volume = Math.max((hydrogen + oxygen + visWater), 0.01);
    // Correct temperature expansion
    volume = volume * (273 + temp) / 293;
    return volume;
}

function doFps() {
    var ret = " H: " + hydrogen + " O: " + oxygen + " W: " + water;
    document.getElementById("fpsOut").innerHTML = fps + " "; //+ ret;
    fps = 0;
    setTimeout(doFps, 1000);
}

// Here the reaction is calculated
function igniteGas() {
    elm_ignite_spark.setAttributeNS(null, 'display', 'inline');
    sparkTime = 5;
    var reHydrogen = hydrogen;
    var reOxygen = hydrogen;
    if (reOxygen > oxygen) {
        reHydrogen = oxygen;
        reOxygen = oxygen;
    }
    if (reHydrogen > 0.3) {
        elm_boom_sound.play();
        document.body.style.backgroundColor = "#ffffff";
        setTimeout(resetBG, 40);
        explodeVol = (hydrogen + oxygen) * 10;
        if (explodeVol > 21) {
            explodeVol = 21;
        }
        hydrogen -= reHydrogen;
        oxygen -= reOxygen;
        water += reHydrogen;
    }
}

function resetBG() {
    document.body.style.backgroundColor = "#d9d9d9";
}

// Temperature Functions
function tempUpUp() {
    setTemp += 10;
    if (setTemp > 350) {
        setTemp = 350;
    }
}

function tempUp() {
    setTemp += 1;
    if (setTemp > 350) {
        setTemp = 350;
    }
}

function tempDown() {
    setTemp -= 1;
    if (setTemp < 20) {
        setTemp = 20;
    }
}

function tempDownDown() {
    setTemp -= 10;
    if (setTemp < 20) {
        setTemp = 20;
    }
}

// Functions for valve functionality and drawing
function toggleHydrogen() {
    if (hydrogenValve == 0) {
        hydrogenValve = 1;
    } else {
        hydrogenValve = 0;
    }
    drawValves();
}

function toggleOxygen() {
    if (oxygenValve == 0) {
        oxygenValve = 1;
    } else {
        oxygenValve = 0;
    }
    drawValves();
}

function toggleExit() {
    if (exitValve == 0) {
        exitValve = 1;
    } else {
        exitValve = 0;
    }
    drawValves();
}

function drawValves() {
    if (exitValve == 0) {
        elm_valve_exit.setAttributeNS(null, 'width', '14');
        elm_valve_exit.setAttributeNS(null, 'height', '2.6');
        elm_valve_exit.setAttributeNS(null, 'x', '0.5');
        elm_valve_exit.setAttributeNS(null, 'y', '-17.3');
    } else {
        elm_valve_exit.setAttributeNS(null, 'width', '2.6');
        elm_valve_exit.setAttributeNS(null, 'height', '14');
        elm_valve_exit.setAttributeNS(null, 'x', '6.2');
        elm_valve_exit.setAttributeNS(null, 'y', '-23');        
    }
    if (hydrogenValve == 0) {
        elm_valve_hydrogen.setAttributeNS(null, 'width', '14');
        elm_valve_hydrogen.setAttributeNS(null, 'height', '2.6');
        elm_valve_hydrogen.setAttributeNS(null, 'x', '-103.5');
        elm_valve_hydrogen.setAttributeNS(null, 'y', '102.7');
    } else {
        elm_valve_hydrogen.setAttributeNS(null, 'width', '2.6');
        elm_valve_hydrogen.setAttributeNS(null, 'height', '14');
        elm_valve_hydrogen.setAttributeNS(null, 'x', '-97.8');
        elm_valve_hydrogen.setAttributeNS(null, 'y', '97');
    }
    if (oxygenValve == 0) {
        elm_valve_oxygen.setAttributeNS(null, 'width', '14');
        elm_valve_oxygen.setAttributeNS(null, 'height', '2.6');
        elm_valve_oxygen.setAttributeNS(null, 'x', '-118.8');
        elm_valve_oxygen.setAttributeNS(null, 'y', '102.7');
    } else {
        elm_valve_oxygen.setAttributeNS(null, 'width', '2.6');
        elm_valve_oxygen.setAttributeNS(null, 'height', '14');
        elm_valve_oxygen.setAttributeNS(null, 'x', '-113.1');
        elm_valve_oxygen.setAttributeNS(null, 'y', '97');        
    }
}

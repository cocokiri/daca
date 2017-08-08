//-------------FUNCTIONS GO HERE ------------
const SEMITONE_FACTOR = 1.05946309436; //12 root of 2 (2 = octave multiple, octave has 12 semitones)

// const KEYCODEMAPPING_ZIGZAG = [65, 87, 83, 69, 68, 82, 70, 84, 71, 89, 72, 85, 74, 73];
const KEYCODEMAPPING_PIANO = [65, 87, 83, 69, 68, 70, 84, 71, 89, 72, 85, 74, 75];
const KEYCODES_NUMERALS = [192, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 189, 187];


const CHORD_STRUCTURES = [
    ["Major", 4, 7],
    ["Major 6th", 4, 7, 9],
    ["Dominant 7th", 4, 7, 10],
    ["Major 7th", 4, 7, 11],
    ["Minor", 3, 7],
    ["Minor 6th", 3, 7, 9],
    ["Minor 7th", 3, 7, 10],
    ["Augmented", 4, 8],
    ["Diminished 7th", 3, 6, 9],
    ["Suspended 4", 5, 7],
    ["Suspended 2", 2, 7]
];
const CHORDS_ABBREVIATED = {
    Major: "",
    Major6th: "maj6",
    Dominant7th: "7",
    Major7th: "m7",
    Minor: "m",
    Minor6th: "m6",
    Minor7th: "m7",
    Augmented: "aug",
    Diminished7th: "dim7",
    Suspended4: "sus4",
    Suspended2: "sus2"
}
const chromaticC = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
    "C"
];
const chromaticC2 = [
    "C",
    "C+",
    "D",
    "D+",
    "E",
    "F",
    "F+",
    "G",
    "G+",
    "A",
    "A+",
    "B",
    "C"
];

const chromaticC3 = [
    "C",
    "C''",
    "D",
    "D''",
    "E",
    "F",
    "F''",
    "G",
    "G''",
    "A",
    "A''",
    "B",
    "C"
];

function differenceArray(arr1, arr2) {
    let diffArr = [];
    let same = false;
    let longer = arr1,
        shorter = arr2;

    if (arr2.length > arr1.length) {
        longer = arr2;
        shorter = arr1;
    }

    for (let i of longer) {
        let same = false;
        for (let j of shorter) {
            if (i === j) {
                same = true;
            }
        }
        if (!same) {
            diffArr.push(i);
        }
    }
    //again switching roles
    for (let i of shorter) {
        let same = false;
        for (let j of longer) {
            if (i === j) {
                same = true;
            }
        }
        if (!same) {
            diffArr.push(i);
        }
    }
    return diffArr;
}

function noteNumbersToStringArray(noteNumbers) {
    if (noteNumbers.length === -1) {
        console.log("noteToString entered was not an array, man")
    }

    let stringArr = [];
    for (let number of noteNumbers) {
        stringArr.push(chromaticC[number]);
    }
    return stringArr;
}

function TopBinsRaw(segment, highestEnergyReference) { //get array of biggest
    let topBins = [];
    for (var i = 0; i < segment.length; i++) {
        if (segment[i] >= highestEnergyReference / 1.7) {
            topBins.push(i);
        }
    }

    for (var i = 0; i < topBins.length; i++) {
        topBins[i] = correctToLowestPeak(topBins[i], segment);
    }
    topBins.sort(function(a, b) {
        return a - b
    }); //sort in ascending order
    RemoveAllDuplicates(topBins)
    return topBins;
}

const hasClass = function(el, className) {
    if (el.classList)
        return el.classList.contains(className)
    else
        return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)')) //?
    }

const addClass = function(el, className) {
    if (el.classList)
        el.classList.add(className)
    else if (!hasClass(el, className))
        el.className += " " + className
}

const removeClass = function(el, className) {
    if (el.classList)
        el.classList.remove(className)
    else if (hasClass(el, className)) {
        var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
        el.className = el.className.replace(reg, ' ')
    }
}

function TopBinClusters(bins, spectrumSegment) {
    if (bins.length == 0) {
        return -1;
    }
    console.log(bins + "  RAW");
    let reducedBins = ClusterArrayIntoNeighborGroups(bins); //now we have reducedBins like = [54,56,57], [76,77,78] , [83,84] etc...
    console.log(reducedBins + " before ");
    //1) AVERAGING APPROACH (might be better to just pick the biggest)
    for (var i = 0; i < reducedBins.length; i++) {
        //The Array in the Array!
        reducedBins[i] = BiggestKeyInArraySegment(reducedBins[i], spectrumSegment);
    }
    // let clusterSize = reducedBins[i].length;
    // let clusterSum = reducedBins[i].reduce(function(accumulator, currentVal) { //.reduce remembers the last callBack value (accumulator)
    //     return accumulator + currentVal;
    // }, 0); //0 is initialvalue
    // if (clusterSize !== 0) {
    //     reducedBins[i] = Math.round(clusterSum / clusterSize); //
    //     // TODO average the bin values ---> Interpolation would be better
    // }

    return reducedBins;

}

function RemoveNeighborDuplicates(array) {
    let last = array[0];
    for (var i = 1; i < array.length; i++) {
        if (last == array[i]) {
            array.splice(i, 1);
            i--; //make 'last' stay at same index
        }
        last = array[i];
    }
}

function RemoveAllDuplicates(array) {
    var arr = array;
    for (var i = 0; i < arr.length; i++) {
        for (var j = i + 1; j < arr.length; j++) {
            if (arr[i] == arr[j]) {
                arr.splice(j, 1);
                j--;
            }
        }
    }
}

function isNeighbor(next, current) {
    return Math.abs(next - current) <= 2; //small difference
}

//the callBack inside navigator.getUserMedia
function SetupAuxNodes(stream) {
    stream.onended = function() {
        console.log('Stream ended');
    }
    let untilBin = 500;
    let threshold = 0.1;
    let audioCtx = new window.AudioContext();
    let source = audioCtx.createMediaStreamSource(stream);
    let analyserNode = audioCtx.createAnalyser();
    source.connect(analyserNode); //automatically creates and CONNECTS AnalyserNode to AudioSource

    analyserNode.fftSize = 16384; //default is 2048 - a multiple of 2
    analyserNode.minDecibels = -80;

    let binSize = audioCtx.sampleRate / analyserNode.fftSize;
    let data = new Uint8Array(analyserNode.frequencyBinCount);

    function recording() {
        analyserNode.getByteFrequencyData(data);
        let segment = data.slice(0, untilBin);
        //the good part. Attention --> indexes might get mixed up if beginning isn't 0

        let winnerBin = highestIndex(segment, threshold); //returns -2 when energy too low
        //console.log(winnerBin + "BIN");
        let winnerBinNorm = correctToLowestPeak(winnerBin, segment);

        // -- GET PITCH
        let fundamental = winnerBinNorm * binSize;
        let midi = HzToMIDI(fundamental).toFixed(2);
        //midi = Math.round(midi*10) / 10; // math round to 1 digit afer comma eg 65.1
        // let pitch = MIDImoduloTwelve(midi); // from 0 - 12. 0 being C
        //
        // //Continue to Process Arrays for POLYPHONIC
        // let binarray = TopBinsRaw(segment, segment[winnerBin]);
        // let reduxbins = TopBinClusters(binarray, segment);
        // //let intervals = findIntervalsBetweenNotes(reduxbins);

        return midi;
    }
    return recording;
}
function SetupPolyphonic(stream) {
    stream.onended = function() {
        console.log('Stream ended');
    }
    let untilBin = 500;
    let threshold = 0.1;
    let audioCtx = new window.AudioContext();
    let source = audioCtx.createMediaStreamSource(stream);
    let analyserNode = audioCtx.createAnalyser();
    source.connect(analyserNode); //automatically creates and CONNECTS AnalyserNode to AudioSource

    analyserNode.fftSize = 16384; //default is 2048 - a multiple of 2
    analyserNode.minDecibels = -80;

    let binSize = audioCtx.sampleRate / analyserNode.fftSize;
    let data = new Uint8Array(analyserNode.frequencyBinCount);

    function recording() {
        analyserNode.getByteFrequencyData(data);
        let segment = data.slice(0, untilBin);
        //the good part. Attention --> indexes might get mixed up if beginning isn't 0

        let winnerBin = highestIndex(segment, threshold); //returns -2 when energy too low
        //console.log(winnerBin + "BIN");
        let winnerBinNorm = correctToLowestPeak(winnerBin, segment);

        // -- GET PITCH


        let binarray = TopBinsRaw(segment, segment[winnerBin]);
        let reduxbins = TopBinClusters(binarray, segment);

        //the
        let MIDIs = reduxbins.map(el => HzToMIDI( el * binSize ).toFixed(2) );

        // let fundamental = winnerBinNorm * binSize;
        // let midi = HzToMIDI(fundamental).toFixed(2);
        return MIDIs;
    }
    return recording;
}



function ClusterArrayIntoNeighborGroups(array) {
    new2DArray = [];
    tempArray = [];
    let arr = array;
    let last;
    let next;
    if (arr.length != 0) {
        for (var i = 0; i < arr.length; i++) {
            last = arr[i];
            next = arr[i + 1];
            //console.log("last " + last + " -- n" + next + isNeighbor(next, last));

            if (i == 0) {
                tempArray.push(arr[i]);
                //first item has no last neighbor = > 1st cluster
            }
            if (isNeighbor(next, last) && i != arr.length - 1) { //don't push undefined when next goes over the array
                tempArray.push(next);
                //if you are neighbor with last item, you get into the current cluster
            } else {
                new2DArray.push(tempArray);
                //next != neighbor --> push off into array to end current cluster
                tempArray = [];
                if (i != arr.length - 1) { //no undefined!
                    tempArray.push(next);
                } //the clusterbreaker is the first item in next cluster
            }
        }
    }
    return new2DArray;
}

function MatchIntervalwithPossibleChords(interval, allChords) {
    let chordGuess = "";
    for (let chordArray of allChords) {
        let counter = 0; //do all elements fit?

        for (let j = 1; j < chordArray.length; j++) {
            if (chordArray[j] === interval[j - 1]) { //both are sorted...CHORDSTRUCTs just starts with numbers at [1]
                counter++; //get enough hits
            }
        }
        if (counter === chordArray.length-1 && counter === interval.length) { //-1 bc of name entry @ [0] //or chordArray.length-1
            chordGuess = chordArray[0]; //that's where the name is stored
        }
    }
    return chordGuess;
}

function notesToChordGuess(playedNotes, allChordStructures) {
    const pn = playedNotes.slice(0);
    console.log(pn);
    let chord = ""; //falsy or empty
    let myIntervals = ascendingIntervalCombinations(pn); //2D array

    for (let i = 0; i < myIntervals.length; i++) {
        chord = MatchIntervalwithPossibleChords(myIntervals[i], allChordStructures);

        if (chord) {
            let basenote = pn[i]%12;
            return chromaticC[basenote] + " " + chord; //if it's the 2nd interval that matches it was also the second note that is the winner
        }
    }
    return "";
}

function ascendingIntervalCombinations(notes) { //ONLY ASCENDINGLY SORTED ARRAYS!
    let myNotes = notes.slice(0); //don't mutate
    if (!isAscending(myNotes)) {
        throw "Not Ascending Interval @ ascendingIntervalCombinations"
    }
    let allIntervalCombinations = []; //will be 2D array
    for (let note of myNotes) { //one time for everybody to be first in array once
        let intervals = [];

        for (let i = 1; i < myNotes.length; i++) { //get difference to every non-self entry intervals.length = notes.length-1 then. Derivatives
            intervals.push(calcInterval(myNotes[0], myNotes[i]));
            //always take the delta from the first item (we'll put that on the end of array after loop);
        }
        allIntervalCombinations.push(intervals); //save the interval to later cross check with chordGuess

        //shift baseNote from start to End
        let moveToEnd = myNotes[0]; //move first entry in array to end -- SPLICE returned an array...fuck it
        moveToEnd += 12; //to get a correct stepsize from e.g B to A...so that it's 10, not -2 ___that's the mathformat CHORDSTRUCTs are in
        myNotes.push(moveToEnd);
        myNotes.splice(0, 1); //remove the double entry
    }
    return allIntervalCombinations;
}

function isAscending(array) {
    for (let i = 0; i < array.length - 1; i++) {
        if (!(array[i] < array[i + 1])) {
            return false;
        }
    }
    return true;
}

function calcDistance(x1, y1, x2, y2) {
    var d = Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
    return d;
}

function calcDistance3D(x1, y1, z1, x2, y2, z2) {
    var d = Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2 + (z2 -= z1) * z2);
    return d;
}

function calcInterval(pitch1, pitch2) {
    return Math.abs(pitch1 - pitch2);
}

//draws text at pos with rectangle background
function drawTextwBackground(context, text, posX, posY, pitch = 6, rectSize = 60, textSize = 40, beginNewPath = true) {
    if (beginNewPath) {
        context.beginPath();
        //THIS CAUSED a 30min BUG --> the Labels wouldn't delete with CLEAR REACT
        //not because it didn't actually clear, but because the Canvasctx got more and more every rendering
    }
    context.rect(posX - rectSize / 2, posY - rectSize / 2, rectSize, rectSize);
    //COLOR
    context.fillStyle = NumberToHSL(pitch, "75%", "60%");
    context.fill();
    //TEXT
    context.font = "bold " + 30 + "px" + " Verdana"; //works without .toString ...funny
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillStyle = "white";
    context.fillText(text, posX, posY);
    //STROKE
    context.lineWidth = 3;
    context.strokeStyle = "white";
    context.stroke();
}

function drawTextwCircleBg(context, text, posX, posY, pitch = 6, radius = 30, textSize = 30) {
    context.beginPath();
    context.arc(posX, posY, radius, 0, 2 * Math.PI);
    //Apparently doing this doesn't work outside this function....
    context.font = "bold " + 30 + "px" + " Verdana"; //works without .toString ...funny
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 5;
    context.strokeStyle = "white";
    context.stroke();

    context.fillStyle = NumberToHSL(pitch, "75%", "60%");
    context.fill();
    context.fillStyle = "white";
    context.fillText(text, posX, posY);
}

function responsiveObject(context, text, posX, posY, responseTo, triggered = false, rectSize = 50, textSize = 20) {
    context.beginPath();
    context.rect(posX - rectSize / 2, posY - rectSize / 2, rectSize, rectSize);
    //Apparently doing this doesn't work outside this function....
    context.font = "bold " + textSize + "px" + " Verdana"; //works without .toString ...funny
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillStyle = "white";
    context.fill();

    //Smaller rect inside to fake a "Line"
    context.beginPath();
    context.rect(posX - rectSize * 0.9 / 2, posY - rectSize * 0.9 / 2, rectSize * 0.9, rectSize * 0.9);
    context.fillStyle = "black";
    context.fill();
    //I'm stupid ....just make empty rect with stroke....instead
    if (triggered) {
        context.fillStyle = NumberToHSL(responseTo, "75%", "60%");
        context.fill();
        context.fillStyle = "white";
        context.fillText(text, posX, posY);
    }
}

function PixelCoordsToPercentage(posX, posY, range = 100, canvas = document.getElementById("canvas")) {
    if (canvas == null) {
        console.log("No Canvas found Pixel to Coords");
    }
    // let PercentX = posX / canvas.width;

    let startPixX = canvas.width * (100 - range) / 100;

    let PercentX = (posX - startPixX) / (canvas.width - startPixX - startPixX);
    let PercentY = posY / canvas.height;

    return [PercentX, PercentY];
}

function PercentToPixel(percX, percY, range = 100, canvas) {
    if (canvas == null) {
        console.log("No Canvas found Pixel to Coords");
    }
    let centerX = canvas.width / 2;
    let pixX = percX / 100 * canvas.width;
    let adjustmentPerc = (100 - range) / 2 * (centerX - pixX) / centerX;
    let adjustmentPix = adjustmentPerc / 100 * canvas.width;
    let adjustPixForRange = pixX + adjustmentPix;
    let pixY = percY / 100 * canvas.height;
    return [adjustPixForRange, pixY];
}
function angleToVector2D(angle) { //make possible to do fractions and radians as well
    let radian = angle / 360 * (2 * Math.PI); //or angle * 0.01745329252;
    let vector = [
        Math.sin(radian), //x of einheitskreis - Math.cos(radian) //y of einheitsKreis
    ];
    return vector;

}

function angleToVector(angle) { //make possible to do fractions and radians as well
    let radian = angle / 360 * (2 * Math.PI); //or angle * 0.01745329252;
    let vector = {
        x: Math.sin(radian), //x of einheitskreis
        y: -Math.cos(radian) //y of einheitsKreis
    };
    return vector;

}

function radianToVector(rad) { //make possible to do fractions and radians as well //or angle * 0.01745329252;
    let vector = {
        x: Math.sin(radian), //x of einheitskreis
        y: -Math.cos(radian) //y of einheitsKreis
    };
    return vector;
}

function PitchToVector(input) { //make possible to do fractions and radians as well
    radian = input / 12 * 2 * Math.PI; //360 cancels out

    let vector = {
        x: Math.sin(radian), //x of einheitskreis
        y: -Math.cos(radian) //y of einheitsKreis
    };
    return vector;
}

function RadianToDegree(radian) {
    let degrees = radian * 360 / (2 * Math.PI);
    return degrees;
}

function AngleBetweenTwoVectors(ax, ay, bx = 0, by = 1) { //centerline
    let v1 = normalizeVector(ax, ay);
    let v2 = normalizeVector(bx, by);

    let dotProduct = v1.x * v2.x + v1.y * v2.y; //dot Product
    let radians = Math.acos(dotProduct);

    let angle = radians * 360 / (2 * Math.PI);

    if (v1.x < 0 || v2.x < 0) {
        angle = 360 - angle;
    }
    return angle;
}

function calcVecMagnitude(x, y) {
    return Math.sqrt(x * x + y * y);
}

function normalizeVector(x, y) {
    if (x === 0 && y === 0) {
        return {x: 0, y: 0};
    }
    let divideBy = calcVecMagnitude(x, y);
    x /= divideBy;
    y /= divideBy;
    return {x, y};
}

function BiggestKeyInArraySegment(array, spectrumSegm, fromIndex = 0, toIndex = array.length) {
    let biggestKeyinArray = array[fromIndex]; //default
    for (var i = fromIndex; i < toIndex; i++) {
        if (spectrumSegm[array[i]] > spectrumSegm[biggestKeyinArray]) {
            biggestKeyinArray = array[i];
        }
    }
    return biggestKeyinArray;
}

function drawFundamentalAndNeighbors(winnerBin, segment, highestEnergyReference, testGap) {
    //loop through bins

    var binWidth = window.innerWidth / 10;
    var xPos = 0;
    //canvasCtx.fillStyle = "hsl(30, 100%, 60%)";
    for (var i = winnerBin - 5; i <= winnerBin + 5; i++) {

        var relativeSize = segment[i] / highestEnergyReference * ((12 - testGap) / 12 * 0.8);
        var binHeight = window.innerHeight * relativeSize;

        canvasCtx.fillStyle = NumberToHSL(i * binSize);
        canvasCtx.fillRect(xPos, window.innerHeight - binHeight, binWidth / 3, binHeight);
        xPos += binWidth;
    }
}

var drawBinOnCircleRelToEnergy = function(winnerBin, segm, pitch) { //c = counter or part of the circle
    var radian = (pitch / 12) * 2 * Math.PI;
    var x = Math.sin(radian) * 2.5 * segm[winnerBin];
    var y = -Math.cos(radian) * 2.5 * segm[winnerBin];

    ctx.beginPath();
    ctx.moveTo(window.innerWidth / 2, window.innerHeight / 2);
    ctx.lineTo(window.innerWidth / 2 + x, window.innerHeight / 2 + y);
    ctx.strokeStyle = NumberToHSL(pitch);
    ctx.stroke();
    ctx.closePath();
    console.log(count);
}

//every frame
function handleInput(pitch = "X", currentTest) { //both parameters are 0 -12
    if (pitch == undefined || pitch == NaN) {
        return;
    }

    if (pitch == currentTest) {
        counter++;
    } else if (counter > 0) {
        counter--;
    }
    //console.log(counter + " counter")
}

function findIntervalsBetweenNotes(reduxBins) { //input = array
    let pitches = [];
    for (let i = 0; i < reduxBins.length; i++) {
        var pitch = BinToPitch(reduxBins[i]);
        pitches.push(Math.round(pitch));
    }
    //pitches to intervals
    let myIntervals = IntervalsinArray();
    return myIntervals;
}

function isHarmonic(winnerBin, segment) {
    let ratio = segment[winnerBin] / segment[winnerBin * 2]
    //if (segment[winnerBin] )
}

function IntervalsinArray(array) {
    let intervals = [];
    for (let i = 1; i < array.length; i++) {
        intervals.push(IntervalBetweenTwoNotes(array[0], array[i]));
    }
    intervals.push
    return intervals;
}

function IntervalBetweenTwoNotes(pitch1, pitch2) {
    var interval = (12 - (pitch1 - pitch2)) % 12;
    //modulo takes care of restarting the scale
    return interval;
}

function FlexBinsToPitch(bin) { //takes arrays and numbers
    let pitches = [];
    if (Object.prototype.toString.call(bin) === '[object Array]') {
        for (var i = 0; i < bin.length; i++) {
            let pitch = BinToPitch(bin[i]);
            pitches.push(Math.round(pitch));

        }
        return pitches;
    } else {
        return BinToPitch(bin);
    }
}

function BinToPitch(bin) {
    let fundamental = bin * audioCtx.sampleRate / analy.fftSize;
    let midi = Math.round(HzToMIDI(fundamental));
    let pitch = MIDImoduloTwelve(midi);
    return pitch;
}

function IntendedNote(midis) {
    let lastMidi = midis.length - 1;
    if (lastMidi < 100) {
        return;
    }
    let countStreak = 0;
    let deltaScore;
    for (var i = 0; i < 20; i++) {

        deltaScore = 4 * midis[lastMidi] - midis[lastMidi - 5] - midis[lastMidi - 10] - midis[lastMidi - 20] - midis[lastMidi - 30];

        if (deltaScore !== undefined && deltaScore > -0.3 && deltaScore < 0.3) { //[2] is the pitch value [0,1] is for coords
            countStreak++;
        }
    }
    //console.log("DELTA" + "  : -- " + deltaScore);
    if (countStreak > 15 && Math.round(playedMidis[playedMidis.length - 1]) !== Math.round(midis[lastMidi]) && midis[lastMidi] !== -1) {

        playedMidis.push(midis[lastMidi]); //push to array

        return false;
    } else {
        return true;
    }
}

function drawSpectrum(segment, highestEnergyReference, winnerBin = 40, untilIndex = 300) {
    var binWidth = window.innerWidth / untilIndex; //split up screen into equal parts
    //console.log(binWidth + "binW");
    var xPos = -10 * binWidth;
    var yPos;
    var winnerBinPos = [];

    for (var i = 0; i <= untilIndex; i++) {
        var relativeSize = segment[i] / highestEnergyReference;
        var binHeight = window.innerHeight * relativeSize;

        xPos += binWidth;
        yPos = window.innerHeight - binHeight;
        canvasCtx.fillStyle = NumberToHSL(i * binSize);
        canvasCtx.fillRect(xPos, yPos, binWidth, binHeight);
        if (i == winnerBin) {
            winnerBinPos[0] = xPos;
        }
    }
    winnerBinPos[1] = window.innerHeight - (window.innerHeight * segment[winnerBin] / highestEnergyReference) / 2;
    //calculates Y Position of the text pop ups...
    return winnerBinPos; //used @ drawTextwBackground
}

function highestIndex(spectrumData, thresh) {
    let highestIdx = 0;
    for (var i = 0; i < spectrumData.length; i++) {
        if (spectrumData[i] > thresh) {
            if (spectrumData[i] > spectrumData[highestIdx]) {
                highestIdx = i;
            }
        }
    }
    if (highestIdx == 0) {
        return -2;
    }
    return highestIdx;
}

function correctToLowestPeak(biggestIdx, spectrumData) {
    let newIdx = biggestIdx; //by default
    for (var i = 2; i < 6; i++) { //could be better: only divide by 2, 3, 5 (and then again 2 to cover every 1/2-1/10 fundamental fraction)
        let smallerIdx = Math.round(biggestIdx / i); //had problems bc I didn't use .round and JS didn't throw errorMsg
        //function silently didn't compare float bin values...
        let ratio = spectrumData[biggestIdx] / spectrumData[smallerIdx];
        if (ratio > 0.4 && ratio < 8) { //if energies are close together...
            //---check neighbors to be sure
            if (spectrumData[smallerIdx] > spectrumData[smallerIdx + 1]) { //compares neighors energy values
                newIdx = smallerIdx;
            } else if (spectrumData[smallerIdx + 1] < spectrumData[smallerIdx]) {
                newIdx = smallerIdx + 1;
            } else if (spectrumData[smallerIdx - 1] > spectrumData[smallerIdx]) {
                newIdx = smallerIdx - 1;
            }
        }
    }
    return newIdx;
}

function resizeCanvas(cv) {
    if (cv.width < window.innerWidth || cv.width > window.innerWidth) {
        cv.width = window.innerWidth;
    }

    if (cv.height < window.innerHeight || cv.height > window.innerHeight) {
        cv.height = window.innerHeight;
    }
    console.log("cv resized: " + cv.height + "H" + " & " + cv.width + "W");
}

function HzToMIDI(Hz) {
    if (Hz <= 0) {
        return -1;
    }
    let multipleOfBase = Hz / 8.1757989156; //8.17 is C0 which is MIDI 0 for standard tuning

    function getBaseLog(x, y) { //returns the logarithm of y with base x (ie. logxy):
        return Math.log(y) / Math.log(x) //ridiculous the JS doesn't have a function for that
    }
    let midi = 12 * getBaseLog(2, multipleOfBase); //2 as base because = 1 octave
    return midi;
}

function MIDImoduloTwelve(midi) { //starts arrays with C
    return midi % 12;
}

function midiToString(midi) {
    let idx = midi % 12;
    return chromaticC[idx];
}

function midiToFreq(midi) {
    let base = 8.1757989156; //Midi 0 according to internet
    let totalOctaves = 10; //from midi 0 to midi 120
    let multiplier = Math.pow(2, totalOctaves * midi / 120);
    let frequency = base * multiplier;
    return frequency;
}

function NumberToHSL(number, s = "100%", l = "60%") { //HSL is more intuitive then RGB s=100, l =60;
    let num = number;
    if (number > 12) {
        num = HzToMIDI(number) % 12;
    }

    let h = 360 - num * 360 / 12 + 60; //Hue goes gradually around (COUNTERCLOCK) the wheel at pitch '6' => 180deg
    if (h == 360) {
        h = 0;
    }

    return "hsl" + "(" + h + "," + s + "," + l + ")";
}

function NumberToHSLa(number, s = "100%", l = "60%", a = 1) { //HSL is more intuitive then RGB s=100, l =60;
    let num = number;
    if (number > 12) {
        num = number % 12;
    }

    let h = 360 - num * 360 / 12 + 60; //Hue goes gradually around (COUNTERCLOCK) the wheel at pitch '6' => 180deg
    if (h == 360) {
        h = 0;
    }

    return "hsla" + "(" + h + "," + s + "," + l + "," + a + ")";
}

function FreqToHSLa(number, s = "100%", l = "60%", a = 1) { //HSL is more intuitive then RGB s=100, l =60;
    let num = HzToMIDI(number) % 12;

    let h = 360 - num * 360 / 12 + 60; //Hue goes gradually around (COUNTERCLOCK) the wheel at pitch '6' => 180deg
    if (h == 360) {
        h = 0;
    }

    return "hsla" + "(" + h + "," + s + "," + l + "," + a + ")";
}

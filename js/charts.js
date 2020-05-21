'use strict';

const charts = (function(context) {

    var charts = [];

    var padd = 8;


    const chart = function(id, chartData) {

        if(chartData != undefined) {
            if(charts[id] == undefined) {

                charts[id] = {};

                charts[id].title = false;
                if(chartData.title != undefined && chartData.title != false) {
                    charts[id].title = chartData.title;
                }

                charts[id].series = false;
                if(chartData.series != undefined && chartData.series != false) {
                    charts[id].series = chartData.series;
                }

                charts[id].offset = {t:0,l:0,r:0,b:0};
            }
        }

        if(id != undefined) {

            charts[id].dst = document.getElementById(id);

            // create canvas
            charts[id].view = view(id);

            // preparing lines data
            prepare(id);

            // show axes
            showGrid(id);

            // draw lines
            showLines(id);
        }
    }


    const showLines = function(id) {

        var c = charts[id];

        var step = {};
        step.y = (c.view.size().h - (c.offset.t + c.offset.b)) / c.global.grid.amp;

        c.view.g('chart-lines');

        //console.log('step.y = '+c.view.size().h+' - '+(c.offset.t+c.offset.b)+' / '+c.global.amp +' = '+step.y);
        // draw lines
        for(var i in c.series) {

            var s = c.series[i];

            if(s.cls != undefined && s.cls != false) {
                c.view.g('chart-line ' + s.cls);
            } else {
                c.view.g('chart-line');
            }

            if(typeof s.data == 'undefined' || s.data == false) {
                console.log('Not find series data');
                continue;
            }

            var dots=s.data;
            step.x = (c.view.size().w - (c.offset.l + c.offset.r)) / (dots.length - 1);
            console.log('dots.length = '+dots.length);

            var prev={x:c.offset.l.toFixed(3), y:(c.view.size().h - c.offset.b).toFixed(3)};
            var d = '';

            if(typeof s.label == 'undefined') {
                s.label = false;
            }
            var labels = [];

            for(var p=0;p<dots.length;p++) {

                //console.log('dots[p] = '+dots[p]+' c.global.grid.min = '+c.global.grid.min);

                var absValue = dots[p] - c.global.grid.min;

                //console.log('absValue = '+absValue);

                var y = ((c.view.size().h - c.offset.b) - (absValue * step.y)).toFixed(3);
                var x = (c.offset.l + step.x * p).toFixed(3);
                if(p==0) {
                    d = ' M '+x+' '+y;
                } else {
                    d += ' L '+x+' '+y;
                }

                if(s.label != false) {
                    labels.push({x:x,y:y});
                }
                //console.log('bottom: '+(c.view.size().h - c.offset.b));
                //console.log('absValue = '+absValue+', y = '+y+', d = '+d);
            }

            // add line
            c.view.path(d);

            // show labels (if need)
            if(s.label != false && labels.length) {

                if(s.label == 'bobber') {

                    // grouping labels
                    c.view.g('chart-labels bobber');
                    for(var l=0;l<labels.length;l++) {
                        c.view.circle(labels[l].x,labels[l].y,4);
                    }
                    c.view.prev();
                }

            }

            c.view.prev();

        }

        c.view.root();
    }

    const prepare = function(chartId) {
        // draw background rect
        // ...
        var series=charts[chartId].series;

        if(series == false) {
            return false;
        }
        charts[chartId].global = {min:false,max:false};

        if(typeof series != 'object') {
            console.log('Series argument must be object type');
            return false;
        }

        for(var s in series) {

            var d=series[s];

            if(typeof d.data == 'undefined') {
                continue;
            }

            // get amplitude
            var min=Math.min.apply(Math, d.data);
            var max=Math.max.apply(Math, d.data);

            series[s].min = min;
            series[s].max = max;
            series[s].len = d.data.length;

            if(charts[chartId].global.min === false || charts[chartId].global.min > min) {
                charts[chartId].global.min = min;
            }
            if(charts[chartId].global.max === false || charts[chartId].global.max < max) {
                charts[chartId].global.max = max;
            }

        }

    }


    const showGrid = function(chartId) {

        var c=charts[chartId];

        if(c.series == false) {
            return false;
        }

        c.global.amp = c.global.max - c.global.min;

        // calculate left offset from captions
        var eCaption = c.view.text(0,0,c.global.amp,'caption-y');

        c.offset.l = eCaption.getBBox().width + padd * 4;
        c.offset.r = padd;

        // calculate maximum captions on Y axis
        var captionHeight = padd + eCaption.getBBox().height;
        //console.log('captionHeight = '+captionHeight);

        // chart background
        var bg = c.view.rect(c.offset.l, c.offset.t, c.view.size().w - (c.offset.l + c.offset.r), 0, 'plot-background');

        if(typeof c.title != 'undefined') {
            var title = c.view.text(0, 0, c.title, 'title');
            var titleHeight = title.getBBox().height;
            title.setAttribute('y',titleHeight);
            c.offset.t = titleHeight + padd;
        }

        // update top bg position
        bg.setAttribute('y', c.offset.t);
        bg.setAttribute('height', c.view.size().h - (c.offset.b + c.offset.t));

        var maxLines = Math.floor((c.view.size().h - (c.offset.t + c.offset.b)) / captionHeight);

        console.log('c.view.size().h = '+c.view.size().h);
        console.log('c.view.size().h - offset = '+(c.view.size().h - c.offset.t - c.offset.b));
        console.log('captionHeight = '+captionHeight);
        console.log('maxYCaptions = '+maxLines);

        var numCaptions=0;
        var rank=false;

        for(var scale=0;scale < 10;scale++) {

            rank=0.01;

            for(var r=0;r<scale;r++){
                rank *= 10;
            }

            var divider=parseFloat(rank);

            console.log('Rank: '+rank);
            console.log('Divider: '+divider);
            var res=c.global.amp % divider;

            //console.log('Res: '+res);
            var lines = Math.floor(c.global.amp/divider) + 3;
            console.log('lines = '+lines+' maxLines: '+maxLines);

            if(lines <= maxLines) {
                break;
            }
        }

        console.log('c.global.amp: '+c.global.amp+' rank: '+rank);
        // draw lines
        console.log('c.global.min: '+c.global.min+' c.global.max: '+c.global.max);
        c.global.grid = {};

        c.global.grid.min = Math.ceil(c.global.min / rank) * rank - rank;


        c.global.grid.max = Math.ceil(c.global.max / rank) * rank;
        if(c.global.max%rank == 0) {
            c.global.grid.max += rank;
        }

        console.log('c.global.grid.min = '+c.global.grid.min);
        console.log('c.global.grid.max = '+c.global.grid.max);

        c.global.grid.amp = c.global.grid.max - c.global.grid.min;

        numCaptions = c.global.grid.amp / rank + 1;
        console.log("=>>> "+numCaptions+' grid.amp:'+c.global.grid.amp+' '+rank);

        var lineHeight = (c.view.size().h - c.offset.t - c.offset.b)/numCaptions;

        c.view.g('chart-grid');

        for(var l=0;l<numCaptions;l++) {
            var caption = c.global.grid.min + l * rank;
            var captionY = c.view.size().h - c.offset.b - l * lineHeight - lineHeight/2;
            c.view.line(c.offset.l, captionY, c.view.size().w - c.offset.r, captionY, 'grid-line');
            c.view.text(c.offset.l - padd * 2, captionY + eCaption.getBBox().height/4, caption, 'grid-caption');
        }

        c.view.root();

        c.offset.b += lineHeight/2;
        c.offset.t += lineHeight/2;

    }


    const view = function(id) {

        var w;
        var h;

        var container = document.createElement('div');
        container.setAttribute('class','chart-container');
        charts[id].dst.appendChild(container);

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class','chart');

        container.appendChild(svg);

        if(w != undefined && w != false) {
            svg.setAttribute('width',w);
        } else {
            w = svg.getBoundingClientRect().width;
        }
        if(h != undefined && h != false) {
            svg.setAttribute('height',h);
        } else {
            h = svg.getBoundingClientRect().height;
        }

        var parent = svg;

        const size = function() {
            return {w:w,h:h};
        }

        const rect = function(x,y,w,h,cls) {
            return draw.node('rect', {x:x,y:y,width:w,height:h,class:cls}, parent);
        }
        const line = function(x1,y1,x2,y2,cls) {
            return draw.node('line', {x1:x1,y1:y1,x2:x2,y2:y2,class:cls}, parent);
        }
        const circle = function(cx,cy,r,cls) {
            var result = {cx:cx,cy:cy,r:r};

            if(typeof r == 'undefined') {
                delete result.r;
            }

            if(cls != undefined) {
                result = Object.assign({class:cls},result);
            }
            return draw.node('circle', result, parent);
        }
        const path = function(d, attr) {

            // upper case - absolute coordinates, lower case - relative coordinates
            // M - move to
            // L - line to
            // H - horizontal line
            // V - vertical line
            // Z - close path (loop)

            var result = {d:d};
            if(attr != undefined && typeof attr === 'object') {
                result = Object.assign({d:d},attr);
            }
            return draw.node('path', result, parent);
        }
        const text = function(x,y,string,cls) {
            var attr={x:x,y:y};
            if(cls != undefined) {
                attr = Object.assign({class:cls},attr);
            }
            return draw.node('text', attr, parent, string);
        }
        const group = function(cls) {
            var attr = false;
            if(cls != undefined) {
                attr = {class:cls};
            }
            parent = draw.node('g', attr, parent);
            return this;
        }
        const prev = function() {
            parent=parent.parentElement;
            return this;
        }
        const root = function() {
            parent=svg;
            return this;
        }
        const getParent = function() {
            return parent;
        }
        return {
            rect: rect,
            line: line,
            circle: circle,
            path: path,
            text: text,
            // grouping
            g: group,
            // get current parent element
            getParent: getParent,
            // DOM navigate methods
            prev: prev,
            root: root,
            size: size
        }
    }

    const draw = {
        node: function(el,attr,parent,content) {
            var e = document.createElementNS('http://www.w3.org/2000/svg',el);
            if(attr != undefined && attr != false) {
                for(var a in attr) {
                    e.setAttribute(a,attr[a]);
                }
            }
            if(content != undefined && content !== false) {
                e.innerHTML = content;
            }
            if(parent != undefined && parent != false) {
                parent.appendChild(e);
            }
            return e;
        }
    }

    return {
        chart: chart
    };

})(this);
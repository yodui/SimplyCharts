'use strict';

const charts = (function(context) {

    var charts = [];

    var padd = 8;

    var debug = { cnt: 0 };

    var d=document;
    var w=window;

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
            drawLines(id);

            w.addEventListener('load', function() { onLoadEvents(id) });
        }
    }


    const onLoadEvents = function(id) {
        var clip = charts[id].clip;
        clip.setAttribute('width', clip.getAttribute('data-width'));
    }


    var updateZIndex = function(id) {
        var dst = charts[id].dst;

        var series=dst.getElementsByClassName('chart-series');
        if(series.length == 1) {
            return;
        }

        for(var i=0;i<series.length;i++) {
            //console.log(i+' '+series[i]);
            series[i].setAttribute('data-z-index',(i+1));
        }
    }


    const drawLines = function(id) {

        var c = charts[id];

        // coordinates precission
        var coord = {precission:1};

        var step = {};
        step.y = (c.view.size().h - (c.offset.t + c.offset.b)) / c.global.grid.amp;

        c.view.g('chart-series-group');

        //console.log('step.y = '+c.view.size().h+' - '+(c.offset.t+c.offset.b)+' / '+c.global.amp +' = '+step.y);

        // draw lines
        for(var i in c.series) {

            var s = c.series[i];

            var seriesGroup;
            if(s.cls != undefined && s.cls != false) {
                seriesGroup = c.view.g('chart-series ' + s.cls);
            } else {
                seriesGroup = c.view.g('chart-series');
            }

            seriesGroup.setAttribute('data-z-index', parseInt(i)+1);


            seriesGroup.addEventListener('mouseover',function(){

                var series=c.dst.getElementsByClassName('chart-series');
                if(series.length == 1) return;

                // get current series z-index
                var zIndex=parseInt(this.getAttribute('data-z-index'));

                var lastIndex = series.length-1;
                var lastSeries = series[lastIndex];

                if(zIndex != lastIndex+1) {
                    // set chart on last place
                    lastSeries.parentNode.appendChild(this);
                    // reindex charts z-index
                    updateZIndex(id);
                }
            });

            seriesGroup.addEventListener('mouseout',function(){

            });

            if(typeof s.data == 'undefined' || s.data == false) {
                console.log('Not find series data');
                continue;
            }

            var dots=s.data;
            step.x = (c.view.size().w - (c.offset.l + c.offset.r)) / (dots.length - 1);

            var prev={x:0, y:0};
            var d = '';

            if(typeof s.showing == 'undefined') {
                // show animation line on load page
                s.showing = true;
            }

            if(typeof s.label == 'undefined') {
                s.label = false;
            }
            var labels = [];

            for(var p=0;p<dots.length;p++) {

                if(dots[p] !== null) {

                    var absValue = dots[p] - c.global.grid.min;

                    var y = ((c.view.size().h - c.offset.b) - (absValue * step.y)).toFixed(coord.precission);
                    var x = (c.offset.l + step.x * p).toFixed(coord.precission);

                    var moveTo=false;
                    if(p == 0 || (dots[p-1] !== undefined && dots[p-1] === null)) {
                        // check NULL value
                        moveTo = true;
                    }

                    if (moveTo === true) {
                        d += ' M ' + x + ' ' + y;
                        prev.x = x;
                        prev.y = y;
                    }
                    //console.log('prev: ');
                    //console.log(prev);

                    if(s.debug !== undefined && s.debug.coordinates == 'relative') {

                        var dx = step.x.toFixed(coord.precission);
                        if(moveTo === true) {
                            dx = 0;
                        }
                        var dy = (y - prev.y).toFixed(coord.precission);
                        d += ' l ' + dx + ' ' + dy;
                    } else {
                        d += ' L ' + x + ' ' + y;
                    }


                    if(s.label != false) {
                        labels.push({x:x,y:y,label:' '});
                    }

                    prev.x = x;
                    prev.y = y;

                }

                //console.log('absValue = '+absValue);
                //console.log('bottom: '+(c.view.size().h - c.offset.b));
                //console.log('absValue = '+absValue+', y = '+y+', d = '+d);
            }

            // add line
            var line = c.view.path(d);

            var animate = false;
            if(s.showing === false) {
                toggleClass('chart-static', line, true);
            } else {
                seriesGroup.setAttribute('clip-path', 'url(#'+id+'-clip-boundary)');
            }

            s.line = line;

            // expand hover area
            c.view.path(d, {class:'line-tracker'});

            // show labels (if need)
            if(s.label != false && labels.length) {

                // grouping labels
                c.view.g('chart-labels');
                var hasHalo = false;

                for(var l=0;l<labels.length;l++) {

                    var x=labels[l].x;
                    var y=labels[l].y;

                    if(hasHalo === false) {
                        // add halo
                        s.halo = showHalo(c,s,x,y);
                        hasHalo = true;
                    }

                    if(s.label == 'circle') {
                        var d = 'M '+x+' '+y+' m -'+padd/2+' 0 a '+padd/2+' '+padd/2+' 0 1 0 '+padd+' 0 a '+padd/2+' '+padd/2+' 0 1 0 -'+padd+' 0';
                    } else if(s.label == 'rect') {
                        var d = 'M '+(x-(padd/2))+' '+(y-(padd/2))+' l '+padd+' 0 l 0 '+padd+' l '+(-1*padd)+' 0 l 0 '+(-1*padd)+' Z';
                    } else {
                        break;
                    }

                    var path = c.view.path(d, {'transform-origin': x+' '+y});

                    // add hover label events
                    path.addEventListener('mouseover', function(_chart,_series,_x,_y){
                            return function() {
                                // set halo position and show it
                                showHalo(_chart,_series,_x,_y);
                                // show label info popup

                            }
                        } (c,s,x,y)
                    );
                    // add label mouseout event
                    path.addEventListener('mouseout',function(_s){
                            return function() {
                                // hide halo
                                _s.halo.setAttribute('visibility','hidden');
                            }
                        } (s)
                    );

                    path.setAttribute('data-x', x);
                    path.setAttribute('data-y', y);
                }

                c.view.prev();

            }


            c.view.prev();
        }

        c.view.root();

        // prepare tooltip for showing in future
        // create tooltip node
        createTooltip(c);

    }


    const createTooltip = function(c) {
        c.view.g('chart-tooltip');
        // cr = corner radius
        var cr=3;
        var d = 'M 0 0 h 100 a'+cr+','+cr+' 0 0 1 '+cr+','+cr+' v30 a'+cr+','+cr+' 0 0 1 -'+cr+','+cr+' h-100 a'+cr+','+cr+' 0 0 1 -'+cr+',-'+cr+' v-30 a'+cr+','+cr+' 0 0 1 '+cr+',-'+cr+' z';
        var tooltip = c.view.path(d);
        var seriesLabel = c.view.text(0,0);

        var seriesMarker = c.view.tspan(seriesLabel,{'x':6});
        seriesMarker.innerHTML = '●';
        var seriesName = c.view.tspan(seriesLabel,{dx:4});
        seriesName.innerHTML = 'Series name';
        var labelValue = c.view.tspan(seriesLabel,{dx:4});
        labelValue.innerHTML = '555.55';

        // move text on tooltip
        var tBox = seriesLabel.getBBox();
        seriesLabel.setAttribute('y',tBox.height + padd/2);
        // update text position
        tooltip.set
        c.view.prev();
    }

    const showHalo = function(chart, series, x, y) {

        var unit = padd*1.2;
        var d = haloShape(x,y,unit,series.label);

        if(d === false) {
            return false;
        }

        if(series.halo == undefined) {
            return chart.view.path(d, {class:'chart-halo',visibility:'hidden'});
        } else {
            // move halo and show
            series.halo.setAttribute('d', d);
            series.halo.setAttribute('visibility','visible');
        }

    }

    const haloShape = function(x,y,unit,type) {
        var d=false;
        switch(type) {
            case 'rect':
                d = 'M '+(x-unit).toFixed(2)+' '+(y-unit).toFixed(2)+' l '+(unit*2)+' 0 l 0 '+(unit*2)+' l '+(-1*unit*2)+' 0 l 0 '+(-1*unit*2)+' Z';
                break;
            case 'circle':
                d = 'M '+x+' '+y+' m -'+unit+' 0 a '+unit+' '+unit+' 0 1 0 '+(unit*2)+' 0 a '+unit+' '+unit+' 0 1 0 -'+(unit*2)+' 0';
                break;
        }
        return d;
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
        c.offset.r = padd * 2;

        // calculate maximum captions on Y axis
        var captionHeight = padd + eCaption.getBBox().height;
        //console.log('captionHeight = '+captionHeight);

        // chart background
        var bg = c.view.rect(c.offset.l, c.offset.t, c.view.size().w - (c.offset.l + c.offset.r), 0, {class:'plot-background'});

        if(typeof c.title != 'undefined') {
            var title = c.view.text(0, 0, c.title, 'title');
            var titleHeight = title.getBBox().height;
            title.setAttribute('y',titleHeight);
            c.offset.t = titleHeight + padd;
        }

        // update top bg position
        bg.setAttribute('y', c.offset.t);
        bg.setAttribute('height', c.view.size().h - (c.offset.b + c.offset.t));

        // clip path
        var clip = {l:c.offset.l - padd*2, t:c.offset.t + padd, w:c.view.size().w - (c.offset.l + c.offset.r) + padd*4, h:c.view.size().h-(c.offset.t+c.offset.b)+padd*2};

        c.clip = c.view.defs().clipPath({id:chartId+'-clip-boundary',class:'chart-clip'}).rect(clip.l,clip.t,0,clip.h,{'data-width':clip.w});
        c.view.root();


        var maxLines = Math.floor((c.view.size().h - (c.offset.t + c.offset.b)) / captionHeight);

        //console.log('c.view.size().h = '+c.view.size().h);
        //console.log('c.view.size().h - offset = '+(c.view.size().h - c.offset.t - c.offset.b));
        //console.log('captionHeight = '+captionHeight);
        //console.log('maxYCaptions = '+maxLines);

        var numCaptions=0;
        var rank=false;

        for(var scale=0;scale < 10;scale++) {

            rank=0.01;

            for(var r=0;r<scale;r++){
                rank *= 10;
            }

            var divider=parseFloat(rank);

            //console.log('Rank: '+rank);
            //console.log('Divider: '+divider);
            var res=c.global.amp % divider;

            //console.log('Res: '+res);
            var lines = Math.floor(c.global.amp/divider) + 3;
            //console.log('lines = '+lines+' maxLines: '+maxLines);

            if(lines <= maxLines) {
                break;
            }
        }

        //console.log('c.global.amp: '+c.global.amp+' rank: '+rank);
        // draw lines
        //console.log('c.global.min: '+c.global.min+' c.global.max: '+c.global.max);
        c.global.grid = {};

        c.global.grid.min = Math.ceil(c.global.min / rank) * rank - rank;


        c.global.grid.max = Math.ceil(c.global.max / rank) * rank;
        if(c.global.max%rank == 0) {
            c.global.grid.max += rank;
        }

        //console.log('c.global.grid.min = '+c.global.grid.min);
        //console.log('c.global.grid.max = '+c.global.grid.max);

        c.global.grid.amp = c.global.grid.max - c.global.grid.min;

        numCaptions = c.global.grid.amp / rank + 1;
        //console.log("=>>> "+numCaptions+' grid.amp:'+c.global.grid.amp+' '+rank);

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

        const rect = function(x,y,w,h,attr) {
            var result = {x:x,y:y,width:w,height:h};
            if(attr != undefined && typeof attr === 'object') {
                result = Object.assign(result,attr);
            }
            return draw.node('rect', result, parent);
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
            // Curves:
            // A - arc

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
            var txt = draw.node('text', attr, parent);
            if(string != undefined) {
                txt.innerHTML = string;
            }
            return txt;
        }
        const tspan = function(parent, attr) {
            return draw.node('tspan', attr, parent);
        }
        const defs = function() {
            parent = draw.node('defs', null, parent);
            return this;
        }
        const clipPath = function(attr) {
            parent = draw.node('clipPath', attr, parent);
            return this;
        }
        const group = function(cls) {
            var attr = false;
            if(cls != undefined) {
                attr = {class:cls};
            }
            parent = draw.node('g', attr, parent);
            return parent;
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
            tspan: tspan,
            defs: defs,
            clipPath: clipPath,
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


    const toggleClass = function(cls, e, mode) {

        var sCls = e.getAttribute('class');

        if(sCls == null) {
            sCls = '';
        }

        var clsList = sCls.replace(/\s{2,}/i, ' ').split(' ').filter(String);

        var index = clsList.indexOf(cls);
        if(mode === true) {
            if (index == -1) {
                clsList.push(cls);
            }
        } else if(mode === false) {
            if (index != -1) {
                // remove class
                clsList.splice(index, 1);
            }
        }

        e.setAttribute('class', clsList.join(' '));
    }


    return {
        chart: chart
    };

})(this);
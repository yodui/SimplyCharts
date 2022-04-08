(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('Charts', [], function () {
            return (root['Charts'] = factory());
        });
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = factory();
    } else {
        root['Charts'] = factory();
    }

}(this, function () {

    const Charts = {
        version: '0.1',
        list: []
    };

    // Base line charts
    (function(root, Charts){
        'use strict';

        const w = root.window;
        const d = root.document;

        const padd = 8;

        function layout(id) {

            let w;
            let h;

            // current parent element
            let parent = false;

            let container = d.createElement('div');
            container.setAttribute('class','chart-container');

            let dst = d.getElementById(id);
            dst.appendChild(container);

            const svg = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
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

            parent = svg;

            const size = function() {
                return {w:w,h:h};
            }

            const rect = function(x,y,w,h,attr) {
                let result = {x:x,y:y,width:w,height:h};
                if(attr != undefined && typeof attr === 'object') {
                    result = Object.assign(result,attr);
                }
                return draw('rect', result, parent);
            }

            const line = function(x1,y1,x2,y2,cls) {
                return draw('line', {x1:x1,y1:y1,x2:x2,y2:y2,class:cls}, parent);
            }

            const circle = function(cx,cy,r,cls) {
                let result = {cx:cx,cy:cy,r:r};

                if(typeof r == 'undefined') {
                    delete result.r;
                }

                if(cls != undefined) {
                    result = Object.assign({class:cls},result);
                }
                return draw('circle', result, parent);
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
                return draw('path', result, parent);
            }
            const text = function(x,y,string,cls) {
                var attr={x:x,y:y};
                if(cls != undefined) {
                    attr = Object.assign({class:cls},attr);
                }
                var txt = draw('text', attr, parent);
                if(string != undefined) {
                    txt.innerHTML = string;
                }
                return txt;
            }
            const tspan = function(attr, parent) {
                return draw('tspan', attr, parent);
            }
            const defs = function() {
                parent = draw('defs', null, parent);
                return this;
            }
            const clipPath = function(attr) {
                parent = draw('clipPath', attr, parent);
                return this;
            }
            const group = function(attr) {
                parent = draw('g', attr, parent);
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
                // nodes
                dst: dst,
                svg: svg,
                // methods
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
                // get size of layout
                size: size
            }
        }


        function prepare(data) {

            // preparing lines data
            let series=data.series;

            if(series == false) {
                return false;
            }

            data.global = {min:false,max:false,len:false};

            if(typeof series != 'object') {
                console.log('Series argument must be object type');
                return false;
            }

            let maxPoints = 0;

            for(let s in series) {

                const d=series[s];

                if(typeof d.data == 'undefined') {
                    continue;
                }

                // get amplitude
                const min=Math.min.apply(Math, d.data);
                const max=Math.max.apply(Math, d.data);

                series[s].min = min;
                series[s].max = max;
                series[s].len = d.data.length;

                if(data.global.len === false || data.global.len < d.data.length) {
                    data.global.len = d.data.length;
                }
                if(data.global.min === false || data.global.min > min) {
                    data.global.min = min;
                }
                if(data.global.max === false || data.global.max < max) {
                    data.global.max = max;
                }

            }

            return data;
        }


        function drawGrid(id) {

            const c = Charts.list[id];

            if(c.data.series == false) {
                return false;
            }

            c.data.global.amp = c.data.global.max - c.data.global.min;

            // calculate left offset from captions
            const eCaption = c.layout.text(0,0,c.data.global.amp,'caption-y');

            c.offset.l = eCaption.getBBox().width + padd * 4;
            c.offset.r = padd * 2;

            // calculate maximum captions on Y axis
            const captionHeight = padd + eCaption.getBBox().height;

            // chart background
            const bg = c.layout.rect(c.offset.l, c.offset.t, c.layout.size().w - (c.offset.l + c.offset.r), 0, {class:'plot-background'});

            if(typeof c.title != 'undefined') {
                const title = c.layout.text(0, 0, c.title, 'title');
                const titleHeight = title.getBBox().height;
                title.setAttribute('y',titleHeight);
                c.offset.t = titleHeight + padd;
            }

            // update top bg position
            bg.setAttribute('y', c.offset.t);
            bg.setAttribute('height', c.layout.size().h - (c.offset.b + c.offset.t));

            // clip path
            const clip = {
                l:c.offset.l - padd*2,
                t:c.offset.t + padd,
                w:c.layout.size().w - (c.offset.l + c.offset.r) + padd*4,
                h:c.layout.size().h-(c.offset.t+c.offset.b)+padd*2
            };

            c.clip = c.layout.defs().clipPath({id:id+'-clip-boundary',class:'chart-clip'}).rect(clip.l,clip.t,0,clip.h,
                {
                    'data-width':clip.w
                }
            );
            c.layout.root();


            const maxLines = Math.floor((c.layout.size().h - (c.offset.t + c.offset.b)) / captionHeight);

            let numCaptions=0;
            let rank=false;

            for(let scale=0;scale < 10;scale++) {

                rank=0.01;

                for(let r=0;r<scale;r++){
                    rank *= 10;
                }

                const divider=parseFloat(rank);

                let res = c.data.global.amp % divider;

                let lines = Math.floor(c.data.global.amp/divider) + 3;

                if(lines <= maxLines) {
                    break;
                }
            }

            // draw lines
            c.data.global.grid = {};

            c.data.global.grid.min = Math.ceil(c.data.global.min / rank) * rank - rank;


            c.data.global.grid.max = Math.ceil(c.data.global.max / rank) * rank;
            if(c.data.global.max%rank == 0) {
                c.data.global.grid.max += rank;
            }

            c.data.global.grid.amp = c.data.global.grid.max - c.data.global.grid.min;

            numCaptions = c.data.global.grid.amp / rank + 1;

            const lineHeight = (c.layout.size().h - c.offset.t - c.offset.b)/numCaptions;

            c.layout.g({class:'chart-grid'});

            for(let l=0;l<numCaptions;l++) {
                const caption = c.data.global.grid.min + l * rank;
                const captionY = c.layout.size().h - c.offset.b - l * lineHeight - lineHeight/2;
                c.layout.line(c.offset.l, captionY, c.layout.size().w - c.offset.r, captionY, 'grid-line');
                c.layout.text(c.offset.l - padd * 2, captionY + eCaption.getBBox().height/4, caption, 'grid-caption');
            }

            c.layout.root();

            c.offset.b += lineHeight/2;
            c.offset.t += lineHeight/2;
        }


        function showHalo(chart, series, x, y) {

            const unit = padd*1.2;
            const d = haloShape(x,y,unit,series.label);

            if(d === false) {
                return false;
            }

            if(series.halo == undefined) {
                return chart.layout.path(d, {class:'chart-halo',visibility:'hidden'});
            } else {
                // move halo and show
                series.halo.setAttribute('d', d);
                series.halo.setAttribute('visibility','visible');
            }
        }


        function haloShape(x,y,unit,type) {
            let d=false;
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


        const createTooltip = function(c) {
            c.tooltip = c.layout.g({class:'chart-tooltip'});
            c.tooltip.wrapper = c.layout.path('');
            c.tooltip.text = c.layout.text(0,0);
            c.tooltip.marker = c.layout.tspan({'x':6}, c.tooltip.text);
            c.tooltip.seriesName = c.layout.tspan({dx:4}, c.tooltip.text);
            c.tooltip.value = c.layout.tspan({dx:4}, c.tooltip.text);
            c.tooltip.value.style.fontWeight = 'bold';
        }


        const updateTooltip = function(c,x,y,seriesName,value,labelType,color) {

            x=parseFloat(x);
            y=parseFloat(y);

            const tooltip = c.tooltip;

            let marker='●';
            switch(labelType) {
                case 'circle':
                    marker = '●';
                    break;
                case 'rect':
                    marker = '■';
                    break;
                case 'triangle':
                    marker = '▲';
                    break;
            }

            // set content and color on marker
            tooltip.marker.style.fill = color;
            tooltip.marker.innerHTML = marker;

            if(seriesName != undefined) {
                tooltip.seriesName.innerHTML = seriesName+':';
            }
            tooltip.value.innerHTML = value;

            // set position text on tooltip
            const tBox = tooltip.text.getBBox();
            tooltip.text.setAttribute('y',tBox.height + padd);

            const wSize = {w:tBox.width+padd*2,h:tBox.height+padd*2};

            // cr = corner radius
            const cr=3;
            const half = parseFloat(wSize.w)/2;

            let d='';
            // tooltip positioning

            const t={x:false,y:false};
            t.y = (y - (wSize.h + padd*3)).toFixed(2);

            if(x+half >= c.layout.size().w-padd) {
                // align tooltip to right
                t.x = (x - wSize.w + cr + padd).toFixed(2);
                d = 'M 0 0 h '+wSize.w+' a'+cr+','+cr+' 0 0 1 '+cr+','+cr+' v'+wSize.h+' a'+cr+','+cr+' 0 0 1 -'+cr+','+cr+' h-'+cr+' l -'+padd+' '+padd+' l -'+padd+' -'+padd+' h-'+(wSize.w-cr-padd*2)+' a'+cr+','+cr+' 0 0 1 -'+cr+',-'+cr+' v-'+wSize.h+' a'+cr+','+cr+' 0 0 1 '+cr+',-'+cr+' z';
            } else if(x-half <= padd) {
                // align tooltip to left
                t.x = (x - cr - padd).toFixed(2);
                d = 'M 0 0 h '+wSize.w+' a'+cr+','+cr+' 0 0 1 '+cr+','+cr+' v'+wSize.h+' a'+cr+','+cr+' 0 0 1 -'+cr+','+cr+' h-'+(wSize.w - padd*2 - cr)+' l -'+padd+' '+padd+' l -'+padd+' -'+padd+' h-'+cr+' a'+cr+','+cr+' 0 0 1 -'+cr+',-'+cr+' v-'+wSize.h+' a'+cr+','+cr+' 0 0 1 '+cr+',-'+cr+' z';
            } else {
                t.x = (x - wSize.w/2).toFixed(2);
                d = 'M 0 0 h '+wSize.w+' a'+cr+','+cr+' 0 0 1 '+cr+','+cr+' v'+wSize.h+' a'+cr+','+cr+' 0 0 1 -'+cr+','+cr+' h-'+(half-padd)+' l -'+padd+' '+padd+' l -'+padd+' -'+padd+' h-'+(half-padd)+' a'+cr+','+cr+' 0 0 1 -'+cr+',-'+cr+' v-'+wSize.h+' a'+cr+','+cr+' 0 0 1 '+cr+',-'+cr+' z';
            }

            tooltip.style.stroke = color;
            tooltip.setAttribute('transform','translate('+t.x+','+t.y+')');

            // update wrapper size
            tooltip.setAttribute('visibility','visible');
            tooltip.wrapper.setAttribute('d',d);
        }


        const onLoadEvents = function(id) {
            const clip = Charts.list[id].clip;
            clip.setAttribute('width', clip.getAttribute('data-width'));
        }


        function drawLines(id) {

            const c = Charts.list[id];

            // coordinates precission
            const coord = {precission:1};

            const step = {};
            step.y = (c.layout.size().h - (c.offset.t + c.offset.b)) / c.data.global.grid.amp;
            step.x = (c.layout.size().w - (c.offset.l + c.offset.r)) / (c.data.global.len - 1);

            c.wrapper = c.layout.g({class:'chart-series-group'});

            const updateZIndex = function(id) {

                const dst = Charts.list[id].layout.dst;

                const series = dst.getElementsByClassName('chart-series');
                if(series.length == 1) {
                    return;
                }

                for(let i=0;i<series.length;i++) {
                    //console.log(i+' '+series[i]);
                    series[i].setAttribute('data-z-index',(i+1));
                }
            }

            // draw lines
            for(let i in c.data.series) {

                const s = c.data.series[i];

                var seriesGroup;
                if(s.cls != undefined && s.cls != false) {
                    seriesGroup = c.layout.g({class:'chart-series ' + s.cls});
                } else {
                    seriesGroup = c.layout.g({class:'chart-series'});
                }

                seriesGroup.setAttribute('data-z-index', parseInt(i)+1);
                seriesGroup.addEventListener('mouseover',function(){

                    const series=c.layout.dst.getElementsByClassName('chart-series');
                    if(series.length == 1) return;

                    // get current series z-index
                    const zIndex=parseInt(this.getAttribute('data-z-index'));

                    const lastIndex = series.length-1;
                    const lastSeries = series[lastIndex];

                    if(zIndex != lastIndex+1) {
                        // set chart on last place
                        lastSeries.parentNode.appendChild(this);
                        // reindex charts z-index
                        updateZIndex(id);
                    }

                });

                if(typeof s.data == 'undefined' || s.data == false) {
                    console.log('Not find series data');
                    continue;
                }


                const dots=s.data;

                let prev={x:0, y:0};
                let d = '';

                if(typeof s.showing == 'undefined') {
                    // show animation line on load page
                    s.showing = true;
                }

                if(typeof s.label == 'undefined') {
                    s.label = false;
                }
                let labels = [];

                for(let p=0;p<dots.length;p++) {

                    if(dots[p] !== null) {

                        const absValue = dots[p] - c.data.global.grid.min;

                        const y = ((c.layout.size().h - c.offset.b) - (absValue * step.y)).toFixed(coord.precission);
                        const x = (c.offset.l + step.x * p).toFixed(coord.precission);

                        let moveTo=false;
                        if(p == 0 || (dots[p-1] !== undefined && dots[p-1] === null)) {
                            // check NULL value
                            moveTo = true;
                        }

                        if (moveTo === true) {
                            d += ' M ' + x + ' ' + y;
                            prev.x = x;
                            prev.y = y;
                        }

                        if(s.debug !== undefined && s.debug.coordinates == 'relative') {

                            let dx = step.x.toFixed(coord.precission);
                            if(moveTo === true) {
                                dx = 0;
                            }
                            let dy = (y - prev.y).toFixed(coord.precission);
                            d += ' l ' + dx + ' ' + dy;
                        } else {
                            d += ' L ' + x + ' ' + y;
                        }

                        if(s.label != false) {
                            labels.push({x:x,y:y,value:dots[p]});
                        }

                        prev.x = x;
                        prev.y = y;

                    }

                }

                // add line
                const line = c.layout.path(d);

                let animate = false;
                if(s.showing === false) {

                    toggleClass('chart-static', line, true);
                } else {
                    seriesGroup.setAttribute('clip-path', 'url(#'+id+'-clip-boundary)');
                }

                s.line = line;

                // expand hover area
                c.layout.path(d, {class:'line-tracker'});

                // show labels (if need)
                if(s.label != false && labels.length) {

                    // grouping labels
                    c.layout.g({class:'chart-labels'});
                    let hasHalo = false;

                    for(let l=0;l<labels.length;l++) {

                        const x=labels[l].x;
                        const y=labels[l].y;

                        if(hasHalo === false) {
                            // add halo
                            s.halo = showHalo(c,s,x,y);
                            hasHalo = true;
                        }

                        if(s.label == 'circle') {
                            d = 'M '+x+' '+y+' m -'+padd/2+' 0 a '+padd/2+' '+padd/2+' 0 1 0 '+padd+' 0 a '+padd/2+' '+padd/2+' 0 1 0 -'+padd+' 0';
                        } else if(s.label == 'rect') {
                            d = 'M '+(x-(padd/2))+' '+(y-(padd/2))+' l '+padd+' 0 l 0 '+padd+' l '+(-1*padd)+' 0 l 0 '+(-1*padd)+' Z';
                        } else {
                            break;
                        }

                        const path = c.layout.path(d, {'transform-origin': x+' '+y});

                        // add hover label events
                        path.addEventListener('mouseover', function(_chart,_s,_x,_y){
                                return function() {

                                    // set halo position and show it
                                    showHalo(_chart,_s,_x,_y);
                                    const value=this.getAttribute('data-value');

                                    // show label info popup
                                    const color = w.getComputedStyle(this).getPropertyValue("stroke");
                                    updateTooltip(_chart,_x,_y,_s.name,value,_s.label,color);

                                }
                            } (c,s,x,y)
                        );
                        // add label mouseout event
                        path.addEventListener('mouseout',function(_chart,_s){
                                return function() {
                                    // hide halo
                                    _s.halo.setAttribute('visibility','hidden');
                                    // hide label
                                    _chart.tooltip.setAttribute('visibility','hidden');
                                }
                            } (c,s)
                        );

                        path.setAttribute('data-value', labels[l].value);
                        path.setAttribute('data-index', l);
                    }

                    c.layout.prev();

                }

                c.layout.prev();
            }

            c.layout.root();

            // prepare tooltip for showing in future
            // create tooltip node
            createTooltip(c);

        }


        function createChart(id, data) {

            if(id == undefined || data == undefined) {
                return false;
            }

            const chart = {
                id: id,
                activateLabel: function(index) {
                    console.log('id: '+id+' activate label: '+index);
                }
            };

            chart.offset = {t:0,l:0,r:0,b:0};

            // create div > svg wrapper
            chart.layout = layout(id);

            chart.data = prepare(data);

            // save chart item
            Charts.list[id] = chart;

            // draw grid
            drawGrid(id);

            // draw lines
            drawLines(id);

            // on load events
            w.addEventListener('load', function() { console.log('on load'); onLoadEvents(id) });

            return Charts.list[id];
        }


        Charts.line = function(id, data) {
            return createChart(id, data);
        }


    }(this || global, Charts));

    // Debug info
    const debug = function() {

    };

    // draw
    const draw = function(el,attr,parent,content){
        const e = document.createElementNS('http://www.w3.org/2000/svg',el);
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
    };

    // toggle class
    const toggleClass = function(cls, e, mode) {

        let sCls = e.getAttribute('class');

        if(sCls == null) {
            sCls = '';
        }

        let clsList = sCls.replace(/\s{2,}/i, ' ').split(' ').filter(String);

        let index = clsList.indexOf(cls);
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

    return Charts;

}));

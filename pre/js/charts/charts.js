//Desarrollo de las visualizaciones
import * as d3 from 'd3';
import { numberWithCommas3 } from '../helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from '../modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C',
COLOR_COMP_1 = '#528FAD';
let tooltip = d3.select('#tooltip');

export function initChart() {
    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_social_4_7/main/data/cuidadores_personas_dependientes_ine_v2.csv', function(error,data) {
        if (error) throw error;
        
        let margin = {top: 12.5, right: 10, bottom: 25, left: 30},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let edades = d3.map(data, function(d){return(d.edad_2)}).keys();
        let tipos = ['Hombres', 'Mujeres'];

        let x = d3.scaleBand()
            .domain(edades)
            .range([0, width])
            .padding(0.5);

        let xAxis = function(svg) {
            svg.call(d3.axisBottom(x));
            svg.call(function(g){g.selectAll('.tick line').remove()});
            svg.call(function(g){g.select('.domain').remove()});
        }

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        let y = d3.scaleLinear()
            .domain([0, 25])
            .range([ height, 0 ]);

        let yAxis = function(svg) {
            svg.call(d3.axisLeft(y).ticks(5).tickFormat(function(d,i) { return numberWithCommas3(d); }));
            svg.call(function(g) {
                g.call(function(g){
                    g.selectAll('.tick line')
                        .attr('class', function(d,i) {
                            if (d == 0) {
                                return 'line-special';
                            }
                        })
                        .attr('x1', '0%')
                        .attr('x2', `${width}`)
                });
            });
        }

        svg.append("g")
            .attr("class", "yaxis")
            .call(yAxis);

        let xSubgroup = d3.scaleBand()
            .domain(tipos)
            .range([0, x.bandwidth()])
            .padding([0]);

        let color = d3.scaleOrdinal()
            .domain(tipos)
            .range([COLOR_PRIMARY_1, COLOR_COMP_1]);

        function init() {
            svg.append("g")
                .selectAll("g")
                .data(data)
                .enter()
                .append("g")
                .attr("transform", function(d) { return "translate(" + x(d.edad_2) + ",0)"; })
                .attr('class', function(d) {
                    return 'grupo-' + d.edad_3;
                })
                .selectAll("rect")
                .data(function(d) { return tipos.map(function(key) { return {key: key, value: d[key]}; }); })
                .enter()
                .append("rect")
                .attr('class', function(d) {
                    return 'rect rect_' + d.key;
                })
                .attr("x", function(d) { return xSubgroup(d.key); })
                .attr("width", xSubgroup.bandwidth())
                .attr("fill", function(d) { return color(d.key); })
                .attr("y", function(d) { return y(0); })                
                .attr("height", function(d) { return height - y(0); })
                .on('mouseover', function(d,i,e) {
                    //Opacidad en barras
                    let css = e[i].getAttribute('class').split(' ')[1];
                    let bars = svg.selectAll('.rect');                    
            
                    bars.each(function() {
                        this.style.opacity = '0.4';
                        let split = this.getAttribute('class').split(" ")[1];
                        if(split == `${css}`) {
                            this.style.opacity = '1';
                        }
                    });

                    //Tooltip > Recuperamos el a??o de referencia
                    let currentEdad = this.parentNode.classList[0];

                    let html = '<p class="chart__tooltip--title">Grupo edad: ' + currentEdad.split('-')[1] + '</p>' + 
                            '<p class="chart__tooltip--text">Un <b>' + numberWithCommas3(parseFloat(d.value).toFixed(1)) + '%</b> de <b>' + d.key.split('_')[0].toLowerCase() + '</b> en este grupo de edad cuidan de personas dependientes</p>';
                    
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);

                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la l??nea
                    let bars = svg.selectAll('.rect');
                    bars.each(function() {
                        this.style.opacity = '1';
                    });
                
                    //Quitamos el tooltip
                    getOutTooltip(tooltip); 
                })
                .transition()
                .duration(2000)
                .attr("y", function(d) { return y(d.value); })                
                .attr("height", function(d) { return height - y(d.value); });
        }

        function animateChart() {
            svg.selectAll(".rect")
                .attr("x", function(d) { return xSubgroup(d.key); })
                .attr("width", xSubgroup.bandwidth())
                .attr("fill", function(d) { return color(d.key); })
                .attr("y", function(d) { return y(0); })                
                .attr("height", function(d) { return height - y(0); })
                .transition()
                .duration(2000)
                .attr("y", function(d) { return y(d.value); })                
                .attr("height", function(d) { return height - y(d.value); });
        }

        /////
        /////
        // Resto - Chart
        /////
        /////
        init();

        //Animaci??n del gr??fico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();

            setTimeout(() => {
                setChartCanvas();
            }, 4000);
        });

        /////
        /////
        // Resto
        /////
        /////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_social_4_7','cuidadores_de_dependientes');

        //Redes sociales > Antes tenemos que indicar cu??l ser??a el texto a enviar
        setRRSSLinks('cuidadores_de_dependientes');

        //Captura de pantalla de la visualizaci??n
        setTimeout(() => {
            setChartCanvas();
        }, 4000);        

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('cuidadores_de_dependientes');
        });

        //Altura del frame
        setChartHeight();
    });    
}
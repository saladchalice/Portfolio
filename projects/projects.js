import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
const projects = await fetchJSON('../lib/projects.json');

// define the project container, class=projects
const projectsContainer = document.querySelector('.projects');
// render
renderProjects(projects, projectsContainer, 'h3');

// Add a count of projects at the top of the page
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

// Initialize selectedIndex to -1
let selectedIndex = -1;

// pie chart
// arcgenerator generates arc paths to display
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

function renderPieChart(projectsGiven){
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
      );
     // re-calculate data
     let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    }).sort((a, b) => a.label - b.label);

    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));

    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let svg = d3.select('svg');
    svg.selectAll('path').remove();
    newArcs.forEach((arc, i) => {
        svg
          .append('path')
          .attr('d', arc)
          .attr('fill', colors(i))
          .on('click', () => {
            selectedIndex = selectedIndex === i ? -1 : i;
            console.log(`Selected index: ${selectedIndex}`);
            svg
            .selectAll('path')
            .attr('class', (_, idx) => (
                selectedIndex === idx ? 'selected' : ''
            ));
        legend
        .selectAll('li')
        .attr('class', (_, idx) => (
            selectedIndex === idx ? 'legend-item-selected' : 'legend-item'
             ));
        
        // Updated code to filter by both year and search query
        let filteredProjects = projects.filter(project => {
            let matchesYear = selectedIndex === -1 || project.year === newData[selectedIndex].label;
            let matchesQuery = Object.values(project).join('\n').toLowerCase().includes(query);
            return matchesYear && matchesQuery;
        });
        renderProjects(filteredProjects, projectsContainer, 'h3');
        });
    });

    // clear existing legend
    let legend = d3.select('.legend');
    legend.selectAll('*').remove();

    // define new legend
    newData.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
            .attr('class','legend-item') // set the class attribute
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            
    });

    
      
}
renderPieChart(projects);

// implementing a search
let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
    // update query value
    query = event.target.value.toLowerCase();
    // filter the projects
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });
    // render updated projects
    let newSVG = d3.select('svg'); 
    newSVG.selectAll('path').remove();
    
    renderProjects(filteredProjects, projectsContainer, 'h3');
    renderPieChart(filteredProjects);
});


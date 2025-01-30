import { fetchJSON, renderProjects } from '../global.js';
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
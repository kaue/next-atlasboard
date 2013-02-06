# Developing AtlasBoard for your own project
## Starting a new project from scratch
That's easy! Simply run `atlasboard new PROJECTNAME` where PROJECTNAME is the name of your project. AtlasBoard will do the rest.
## Making your own custom dashboard
Create a new file in my-dashboard/dashboards/
The file can be JSON (preferred) or EJS.
To speed up the process, using `atlasboard generate dashboard NAME` will make a new dashboard with the name you specified. You can then access this dashboard while the server is running at http://localhost:4444/NAME by default

## Making your own widgets
Widgets are located in my-wallboard/widgets/ hosted in an independent folder. Each folder contains an html file, a js file and a css file, all matching the name of the widget directory.
To create your own widget, run `atlasboard generate widget NAME` where NAME is the name you want for your new widget.

## Making your own jobs
Jobs are located in my-wallboard/jobs and contain a .json file for parameters and a .js file for the job itself. An event name takes the form of %job-directory%-%json-file-name%. See existing files for templates.
To create a new job, run `atlasboard generate job NAME` where NAME is the name you want for your new widget.

### Need Authentication? No problem
Add your passwords in the file my-wallboard/globalAuth.json. See globalAuth.json.sample for a template.

# Hosting an AtlasBoard server
Step 1. Install the server dependencies with `npm install` if they're not already there.
Step 2. Start the server with `atlasboard start` in the my-dashboard/ directory.

# License: Apache License 2.0
Copyright 2013 Atlassian

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
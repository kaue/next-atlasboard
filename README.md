Getting Started - A Dashboard in 5 Steps
============
1. Install node
2. Install atlasboard

    2.1 Ideally, this will one day be published as an official npm package, but at the moment you'll need to download the source directly, then tell node that the module can be found there.

        # Clone the repo
        $ git clone git@bitbucket.org:atlassian/atlasboard.git

        # Tell node that the atlasboard module is located here
        $ cd atlasboard
        $ npm link
        $ cd path/to/my-wallboard
        $ npm link atlasboard
        $ npm install # This will install atlasboard's dependencies too

3. Create a new dashboard with `atlasboard new mydashboard`
4. Start your server with `atlasboard start`
5. Check it out at http://localhost:4444/

Everything Else
=============
Creating your own Dashboard Project, Job, Widget or Dashboard
-----------
AtlasBoard has a built-in project/job/widget generator, so this is all very straightforward and simple.

**To create a wallboard project:**

`$ atlasboard new PROJECTNAME` Creates a folder in this directory called PROJECTNAME which contains all the necessities for a fully functional AtlasBoard server

**To create a new job/widget/dashboard:**

`$ atlasboard generate job JOBNAME` (Replace job with widget or dashboard depending on what you want.) Creates an item with that name in the relevant place. Dashboard is then accessible at localhost:4444/NAME

**To run your AtlasBoard server:**

`$ atlasboard start`

FAQs
-------
**What Programming Languages do I need to know?**

JavaScript. That's it. If you want things to look nicer, some very basic level HTML and CSS might come in handy too.

**Which port is the AtlasBoard server hosted on?**

By default, this is port 4444 (i.e. the server will be at http://localhost:4444). Currently, this can be changed in the atlasboard/lib/atlasboard.js file (this will involve editing the node module's source code, so bear that in mind if you update AtlasBoard).

**Does dragging the widgets around on my screen affect other people's dashboards?**

No, this is just a local thing. Unfortunately, these changes you make don't persist (yet) either.

**Where can I learn about making widgets/jobs/dashboards?**

I recommend making a sample project by using atlasboard new PROJECTNAME. This will generate the dashboard shown here, and contains some great sample code for a range of different widget/job types.

**What format should my dashboard be in?**

If you're writing a new dashboard file (i.e. a file that lets you view a different set of widgets while still connecting to the same server), you can write this as a JSON file (easiest, preferred, see existing examples) or an EJS file.

Legal
==============

License: Apache License 2.0
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
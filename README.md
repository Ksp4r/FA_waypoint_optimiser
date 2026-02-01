
To use this code, you'll first want to install a browser extension that can inject it into a webpage. I use <a href="https://addons.mozilla.org/en-US/firefox/addon/codeinjector/?utm_content=addons-manager-reviews-link&utm_medium=firefox-browser&utm_source=firefox-browser" target="_blank">Code Injector</a> for firefox, you can also try [User JavaScript and CSS](https://chromewebstore.google.com/detail/user-javascript-and-css/nbhcbdghjpllgmfilhnhkllmkecfmpld?hl=en-US&utm_source=ext_sidebar) for chrome. There are other ways of doing this, like HTML overrides and such, but this seems to be the easiest and most consistent, so i'll suggest this method for now.

Once you have your extension of choice, copy the javaScript content you want to use from this repository, navigate to the specific webpage it is designed for, then open the extension and paste the code into the "script" section. You don't even need to download the file, just open it from here and copy the contents.

That should be about all you need to do, the script should run every time the page is loaded.

I totally understand if you're hesitant to just add some random sketchy code from some guy you know over the internet and try to run it on your computer. No pressure, was just a fun little project to play around with.

Good luck, and have fun.

# FA_waypoint_optimiser

Code is still what you would call "beta".

Designed for <a href="https://idavis-elvenar.com" target="_blank" rel="noopener noreferrer">idavis-elvenar.com</a>. The FA section of the webpage is under More -> Fellowship Adventures. you can [Skip straight there](https://idavis-elvenar.com/fellowship-adventures.html#waypoints) if you'd prefer. 

# EA_Building Ranker

For those that have trouble keeping track of culture distribution throughout their cities. 
The Building ranker, when injected into <a href="https://www.elvenarchitect.com" target="_blank">ElvenArchitect.com</a>, gives you the option to highlight and rank all culture/population buildings based on a value/tile score and returns an average culture/population per tile across them all.
Buildings are ranked from 0 upwards with the key showing each rank's score, so finding buildings to replace should be relatively straightforward. Simply add the building you're thinking of from the "build" menu button and click the ranking button again to recalculate.

Easiest way about this is to first find your username on <a href="https://elvenstats.com">ElvenStats.com</a>, update your info then click the "view city in elven architect" link.

# Spire Guide

The Spire Guide simplifies negotiations at the Spire of Eternity. Estimations are pretty generic at the moment, so don't expect a miracle, but it takes a lot of the preprocessing out of the process.

There is nowhere really to inject the Spire of Eternity guide, so it is instead hosted as its own page. The page can be found at <a href="https://ksp4r.github.io/FA_waypoint_optimiser/"> this link.</a> This was moreso a matter of me playing around with hosting a site from github, but i'll look into fleshing it out a little more in the future.

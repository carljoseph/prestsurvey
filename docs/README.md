

# Prest Social Survey Viewer

A simple webpage that displays the location and images of the University of Melbourne Social Survey conducted by Wilfred Prest between 1941 - 1943[^1].

The site only deals with survey data from the Coburg, VIC Australia location. A model using Google Document AI was trained on the handwriting in the survey forms. The street address, municipality, and survey date were extracted from the survey images. Address data were then verified using Google's Geocoding API, with further validation using Python's [https://docs.python.org/3/library/difflib.html](`difflib`) and some manual checking. 

The site itself uses Google Maps Javascript API to render the map and provide interactivity controls. As individual pages from the survey archive's PDFs can't easily be referenced programatically, the relevant survey form images are stored in the /images/ folder. 

[View the website](https://carljoseph.github.io/prestsurvey)


## License

Prest Social Survey Viewer © 2024 by Carl Joseph is licensed under [https://creativecommons.org/licenses/by-nc-sa/4.0/](CC BY-NC-SA 4.0)


## Contact

- [https://bsky.app/profile/carljoseph.bsky.social](carljoseph.bsky.social)
- [https://carljoseph.com.au](Website)


## Footnotes
[^1]: University of Melbourne Social Survey (1941-1943), \[UMA-EV-000000005\]. University of Melbourne Archives, accessed 22/04/2024, [https://uma.recollectcms.com/nodes/view/499422](Archive URL)

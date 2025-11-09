#Task Part 2 

Build a website like mobbin where we can see various websites in one place and click on them for more details. 
To do this we need to make a cropped version of our existing screenshots so they are can be displayed. 
We should crop to desktop view with and 16:9.

Afterwards we should show all the websites laid out in a grid with The website name and a link underneath. 

Ultimately we want to have a search bar and be able to search the embeddings of all the websites. Before implementing this we should just implement simple text string matching. 


#Task Part 1 (completed)
# Project: High-taste website + description + tags repository

## Overview

A potential client of TasteAI wishes to curate a collection of high-taste websites that it could use as inspirations when users ask for website/web application generations. The potential client’s application will search for website inspiration in this repository based on the user’s prompt, pass the screenshot of appropriate inspiration to the model, and ask the model to generate a website/web application in similar style as the inspiration. Our job is to curate this repository of high-taste websites that the client’s application can easily search through as a step in their code generation pipeline.

## Deliverable

A pipeline that allows us to pass any webpage, and generate the following for each webpage:

1. A full screenshot of the webpage
2. A granular description of the webpage
3. Meta-annotations regarding style, occasion, intent, user type, etc.

The websites can be landing pages, information dense pages (e.g. directories, news/publisher sites, or web applications with logins)

The pipeline would be used to process thousands of webpages for the potential client.

The pipeline should also be extendible to accommodate human annotation as well. As in the future, we might want human annotators to submit websites, or annotate websites that we have curated

Pieces of metadata to extract: 
Style (e.g. modern, brutalist etc)
Font types
Audience (e.g. gen z women) 
Page Type (e.g. homepage, team page, event page, ecommerce page etc.)	
Layout style (standard vs. trendy vs. creative/unique)
Description of intent (e.g. homepage of a VC page)  
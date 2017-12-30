# Trie Architecture

`Phase 1`:  Started June 2, 2017, Ended June 3, 2017

`Phase 2`:  Started June 3, 2017, Ended June 3, 2017

`Phase 2A`: Started June 3, 2017, present

`Phase 3`:  Pending

`Phase 4`:  Pending

TRIE is our AI that handles our search function. TRIE works in the background to make search extremely quick on the client side. On the monitor side. TRIE is responsible for maintaining the trie search tree, monitoring changes in a user's name, and monitoring when contacts are added and removed.

There are two two types of trie trees: a personal tree that contains all the user's contacts, and another tree that shows all users in existence.

## TRIE Database

![alt text](https://www.codeproject.com/KB/recipes/PhoneDirectory/Trie.jpg "TRIE Structure")

The picture above refers to a typical TRIE tree. Each node in the tree represents a letter, each letter either had more letters or a terminal. A terminal indicates that a complete name has been reached. In our case, a terminal will be represented with an `*` which will contain a list of relevant users. Here's an example in Firebase of user 34's personal tree that contains `eke`, `tom`, `tommy`, and `tony`.

![alt text](http://i.imgur.com/nXkCADE.png "TRIE Firebase")

Notice that `o` leads to either `m` or `n` and that `m` leads to either another `m` or and `*` which indicates that there's someone by the name of `tom`

Note: You can *never* query in the global TRIE (`all`) because only one person can ever use that. Each person much query within their own TRIE. Data from the global TRIE will automatically be imported.

## Retrieving Data

Getting search results is extremely simple. For every user, there is a `query`, `results`, and `tree` field. The tree should only be manipulated and traversed by TRIE. When the client changed the `query` field, TRIE will update the `results` field to match the query to the users. Given the tree above, the query `"tom"` would look like this:

![alt text](http://i.imgur.com/G0MipKB.png "TRIE Query")

##  Phases

Building TRIE is a multi-step process that comes in these four chunks.

1. Being able to search by exact key match in all of Minimum
2. Being able to search by approximate key match in all of Minimum.
    1. 2A Accounting for spelling errors
3. Having people who are in my carousel prioritized on top.
4. Using machine learning to prioritize people based on these factors in not particular order:
    1. How often you contact them
    2. How many groups you share
    3. Your messenges sent to message received ratio
    4. Whether or not they belong to your contacts
    5. Whether ot not they belong to your contacts contacts

## Relevancy Calculations

Each ending node in the trie structure has a relevancy index. This index determines the order in which the results are set. Here is the determinant of the relevancy indexes for each phase.

#### Phase 1

```javascript
relevancy = user.name
```

In the first phase, people are sorted alphabetically, so the relevancy index is simply the name.

#### Phase 2/2A

```javascript
relevancy = NLP.distance(user.name, query)
```

In the second phase, we use the Jaro–Winkler distance algorithm to determine who closely a string matches to the query. Any person with a value greater than 0 will be added to the array.

#### Phase 3

```javascript
distance  = NLP.distance(user.name, query)

if (relevancy != 0)
    relevancy = in_contacts? ? distance + 1 : distance
else relevancy = 0
```

In the third phase, we start prioritizing contacts. We're still using the Jaro–Winkler distance algorithm, but we are prioritizing those in our own contacts. By adding 1, we are ensuring that they will always be on top. An alternative to this would be to scale it but a predetermined factor so that they still have advantage, but it's limited:

```javascript
distance  = NLP.distance(user.name, query)

if (relevancy != 0)
    relevancy = in_contacts? ? distance*scale : distance
else relevancy = 0
```

#### Phase 4

In the fourth phase, we use a whole set of factors. The machine learning will happen in the background and we'll simply give the results based on where the system is currently at.

```javascript
relevancy = NueralNetwork.get_relevancy(user.name)
```


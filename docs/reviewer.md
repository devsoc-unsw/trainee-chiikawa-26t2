# Learnten

The Learnten card review system combines the highly-optimized [FSRS spaced repetition algorithm](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/ABC-of-FSRS) with additional features, statistics and progress. 

# Review Types

### **FSRS Scheduled Review**

The standard scheduled review type.

- The FSRS algorithm determines which cards a user should review each day based on spaced repetition principles. This means not all cards will be reviewed every day.

### **Manual Review**

Allows users to review the entirety of a deck. Effectively sets the FSRS due date for the cards being reviewed to the immediate day. These only count for statistics once per day per card, then they are treated as preview reviews with no effect on statistics/data.

- Manual reviews can be used for cramming, or if you just want to review cards ahead of time, since not all cards will be scheduled for that day.
- If a card is new/learning, do not set the due date just allow user to review that card
- Manual reviews can also tell you the score you got at the end of that review, even if they are being treated as preview reviews. This score doesn't count for anything, just for the user to see how they went in that review, e.g. 15/20
- Since the due date is being set prematurely, the FSRS algorithm will recognize this and these reviews will contribute less to card stability. Additionally, they grant less lantern status and xp compared to scheduled review.

### **Preview**

Users can only look through and preview the cards in a deck. The only mode available if the user isn't signed in.

# Tracked Statistics

### **Lantern status**


- Tracks daily commitment to completing reviews.
- This is per card
- It can be either: Blazing Bright, Low fire, Flickering, Broken.
- if you miss a scheduled review it goes down.
- However, if the deck is a refined lantern, and the card stability is greater/equal to the required refined lantern stability, missing a scheduled review will only drop the status by half. (since the user already knows the content well, we don't need to penalize them as much for missing a review).
- if the user has completed a scheduled review on time 2 or more times in a row (2+ day streak), it will go up.
- The lantern status for manual review will go up by half (or less) of the amount that it would for a scheduled review. Also, manual reviews can only contribute once per day.
- Preview reviews have no effect on status

### **Card stability (card mastery)**

- This is the FSRS stability variable. Represents how well the users knows that card.
- If you complete a manual review, FSRS will note the changed due date and barely affect the stability of that card due to its algorithm.
- Additionally, manual reviews can only count once per day, otherwise they are treated as previews and have no effect on the FSRS scheduler.
- Preview reviews have no effect on stability.

### **Deck mastery/Refined Lanterns**


- Deck stability is the average card stability of that deck
- Represents the user's progress in that deck.
- Once it reaches a certain high "mastery amount", the deck becomes a refined lantern.

### **Total cards reviewed for the day**

- Only counts one review per card per day
- Preview reviews have no effect

### **Total lifetime cards reviewed**

- Max one review per card per day
- Preview reviews have no effect

### **Total review streak (days)**



- Any FSRS scheduled or manual review on any card on a day counts adds to the streak.
- or we could make it they have to review all their scheduled cards for it to count
- Missing a day resets the streak

### **Experience (XP)**


- Completing a FSRS scheduled review on time grants xp
- Completing a manual review grants half (or less) of the amount it would for a scheduled review (similar to the lantern status tracking). This can only count once per day.
- Reaching card stability of the "mastery amount" grants extra xp
- Reaching deck mastery/refined lantern status grants extra xp
- Reaching certain lantern status for extended time grants extra xp
- Reaching total review streak milestones (e.g. 14 days in a row, etc.) grants extra xp
- XP can unlock cool collectibles.
- XP determines your Learnten Level.
- XP and level should be displayed in the format: Level 1 - 350/490 XP.

# User configuration

Users can configure multiple settings relating to reviews and algorithm.

- Desired retention (FSRS): This is per deck
- Daily new card limit: Max amount of new cards to introduce in a day
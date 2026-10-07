# Paykar design principles

## Never show emptiness without purpose

If user-specific data is absent:

- Hide the empty personal section.
- Surface useful store content, such as curated shopping sets.
- Provide an action that creates value, such as creating a shopping template.

Reveal order history and personal templates naturally as soon as real data exists.
Show only positive counts; never fill the interface with fake orders or templates.
Keep discovery compact and use one clear primary action.

Errors and important system states must still be communicated. A failed request,
unavailable storage, missing product or failed stock preview is not an empty state
and must retain its explanation and any available recovery action.

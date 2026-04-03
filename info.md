# Chamber Card

Dashboard card for Home Assistant that displays a room, area, or zone with:

- a large central icon
- room title, description, and extra info
- optional temperature, humidity, and brightness info
- quick-action buttons
- tap navigation and hold-to-toggle support

![Chamber Card preview](https://raw.githubusercontent.com/Rhaenon/chamber-card/main/assets/preview.png)

## HACS

Add this repository to HACS as a custom repository with category `Dashboard`:

`https://github.com/Rhaenon/chamber-card`

If the Lovelace resource is not added automatically, use:

```yaml
- url: /hacsfiles/chamber-card/chamber-card.js
  type: module
```

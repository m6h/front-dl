https://mermaid-js.github.io/mermaid-live-editor/

Theme: neutral

Browser mode
```mermaid
graph TB
  style browser fill:lightgreen
  style fdl fill:#209cee

  fdl(front-dl)--Write-->browser{{Your browser}}
```

Directory mode
```mermaid
graph TB
  style browser fill:lightgreen
  style fdl fill:#209cee
  
  fdl(front-dl)--Write-->storage(Storage server)
  mediaServer--Read-->storage
  mediaServer(Media server)--Stream-->browser{{Your browser}}
```
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('API online!');
});

app.listen(port, () => {
  console.log(`all_app_move_bl listening on port ${port}`);
});

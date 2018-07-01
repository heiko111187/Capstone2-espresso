const menuRouter = require('express').Router();
const menuItemRouter = require('./menuItemRouter');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuRouter.param('menuId', (req, res, next, thisMenuId) => {
  const sql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const values = {$menuId: thisMenuId};

  db.get(sql, values, (error, menu) => {
    if(error) {
      next(error);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      return res.sendStatus(404);
    }
  });
});

menuRouter.use('/:menuId/menu-items', menuItemRouter);

menuRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (err, rows) => {
    if(err) {
      next(err);
    } else {
      res.status(200).json({menus: rows});
    }
  });
});

menuRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

menuRouter.post('/', (req, res, next) => {
  const title = req.body.menu.title;

  if(!title) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Menu (title)' +
          'VALUES ($title)';

  const values = {
    $title: title
  };

  db.run(sql, values, function(error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`, (error, row) => {
        res.status(201).json({menu: row});
      });
    }
  });
});

menuRouter.put('/:menuId', (req, res, next) => {
  const title = req.body.menu.title;

  if(!title) {
    return res.sendStatus(400);
  }

  const sql = 'UPDATE Menu SET title = $title ' +
              'WHERE Menu.id = $menuId';
  const values = {
    $title: title,
    $menuId: req.params.menuId
  };

  db.run(sql, values, (error) => {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`, (error, row) => {
        res.status(200).json({menu: row});
      });
    }
  });
});

menuRouter.delete('/:menuId', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const values = {$menuId: req.params.menuId};

  db.all(sql, values, (err, rows) => {

    if(err) {
      next(err);
    } else if(rows.length === 0) {
      db.run(`DELETE FROM Menu WHERE Menu.id = ${req.params.menuId}`, (err) => {
        if(err) {
          next(err);
        } else {
          res.sendStatus(204);
        }
      });
    } else {
      res.sendStatus(400);
    }
  });
});

module.exports = menuRouter;

const menuItemRouter = require('express').Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemRouter.param('menuItemId', (req, res, next, thisMenuItemId) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId';
  const values = {$menuItemId: thisMenuItemId};

  db.get(sql, values, (error, menuItem) => {
    if(error) {
      next(error);
    } else if (menuItem) {
      req.menuItem = menuItem;
      next();
    } else {
      return res.sendStatus(404);
    }
  });
});

menuItemRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const values = {$menuId: req.menu.id};

  db.all(sql, values, (err, rows) => {
    if(err) {
      next(err);
    } else {
      res.status(200).json({menuItems: rows});
    }
  });
});

menuItemRouter.post('/', (req, res, next) => {
  const name = req.body.menuItem.name,
        description = req.body.menuItem.rate,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price;

  if(!name || !inventory || !price) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id)' +
          'VALUES ($name, $description, $inventory, $price, $menu_id)';

  const values = {
    $name: name,
    $description: (!description) ? 'New Description' : description,
    $inventory: inventory,
    $price: price,
    $menu_id: req.menu.id
  };

  db.run(sql, values, function(error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, (error, row) => {
        res.status(201).json({menuItem: row});
      });
    }
  });
});

menuItemRouter.put('/:menuItemId', (req, res, next) => {
  const name = req.body.menuItem.name,
        description = req.body.menuItem.rate,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price;

  if(!name || !inventory || !price) {
    return res.sendStatus(400);
  }

  const sql = 'UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId ' +
            'WHERE MenuItem.id = $menuItemId';

  const values = {
    $name: name,
    $description: (!description) ? "Updated Description" : description,
    $inventory: inventory,
    $price: price,
    $menuId: req.menu.id,
    $menuItemId: req.params.menuItemId
  };

  db.run(sql, values, (error) => {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`, (error, row) => {
        res.status(200).json({menuItem: row});
      });
    }
  });
});

menuItemRouter.delete('/:menuItemId', (req, res, next) => {
  const sql = 'DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId';
  const values = {$menuItemId: req.params.menuItemId};

  db.run(sql, values, (error) => {
    if(error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = menuItemRouter;

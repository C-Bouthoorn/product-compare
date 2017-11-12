// For every product, check if all keys are processed
const VERIFY_NO_LEFTOVER_KEYS = true;


Object.prototype.forEach = function(callback) {
  this.map(callback, false);
};


Object.prototype.length = function() {
  return this.map(() => {}).length;
};


Object.prototype.map = function(callback, store = true) {
  let results = store ? [] : { push: function(){} };

  for (let k in this) {
    if (Object.prototype.hasOwnProperty(k)) continue;
    let v = this[k];

    results.push(callback(k, v));
  }

  return results;
};


Object.prototype.filter = function(callback) {
  let results = {};

  this.forEach((k, v) => {
    if (callback(k, v)) {
      results[k] = v;
    }
  });

  return results;
};


Object.prototype.reduce = function(callback, init = 0) {
  let result = init;

  this.forEach((k, v) => {
    result = callback(result, k, v);
  });

  return result;
};


Object.prototype.keys = function() {
  return this.map((k, v) => k);
};



function ProductTable(id) {
  this.id = id;

  this.rows = [];

  this.createDOM();
}


ProductTable.prototype.createDOM = function() {
  this.domElement = document.getElementById(this.id);
};


ProductTable.prototype.sortBy = function(field, mayreverse=true) {
  console.log(`Sorting by ${field}`);

  let row = this.rows.filter(row => row.field == field).pop();
  let sortOrder = row.getSortOrder(mayreverse);

  this.rows.forEach(row => {
    row.sortByOrder(sortOrder);
  });
};


ProductTable.prototype.addRow = function(row) {
  // enforce type
  if (! row || row.constructor !== ProductRow) {
    console.error('row not instance of ProductRow');
    row = new ProductRow(this, row);
  }

  this.rows.push(row);

  this.domElement.appendChild(row.domElement);
};



function ProductRow(table, field) {
  this.table = table;
  this.field = field;

  this.productDatas = [];

  this.createDOM();
}


ProductRow.prototype.createDOM = function() {
  this.domElement = document.createElement('tr');
  this.addHeader();
};


ProductRow.prototype.addProductData = function(productData) {
  // enforce type
  if (! productData || productData.constructor !== ProductData) {
    console.error('productData not instance of ProductData');
    productData = new ProductData(this, productData);
  }

  this.productDatas.push(productData);

  this.domElement.appendChild(productData.domElement);
};


ProductRow.prototype.addHeader = function() {
  let th = document.createElement('th');
  th.innerHTML = this.field;

  let _this = this;

  th.onclick = function() {
    _this.table.sortBy(_this.field);
  };

  this.domElement.appendChild(th);
}


ProductRow.prototype.getSortOrder = function(mayreverse) {
  // Get data with original index
  let data = this.productDatas.map((x, i) => ({ data: x.data, originalIndex: i }));

  // Get sorted data
  let sorted = data.sort((a, b) => (parseInt(a.data) || Infinity) - (parseInt(b.data) || Infinity));

  // Check if changed
  let changed = sorted.filter((x, i) => x.originalIndex != i).length;
  if (changed === 0 && mayreverse) {
    // Nothing changed, reversing order
    sorted.reverse();
  }

  // Determine sort order
  let sortOrder = sorted.map(x => x.originalIndex);

  return sortOrder;
};


ProductRow.prototype.sortByOrder = function(sortOrder) {
  // Apply new sort order
  let oldlist = this.productDatas;
  let newlist = [];

  sortOrder.forEach((oldi, newi) => {
    newlist[newi] = oldlist[oldi];
  });

  this.productDatas = newlist;

  // recreate DOM
  this.table.domElement.removeChild(this.domElement);
  this.createDOM();
  this.productDatas.forEach(product => this.domElement.appendChild(product.domElement));
  this.table.domElement.appendChild(this.domElement);
};



function ProductData(row, data) {
  this.row = row;
  this.data = data;

  this.createDOM();
}


ProductData.prototype.createDOM = function() {
  this.domElement = document.createElement('td');
  this.domElement.innerHTML = this.data || '';
};




function fetchProducts(callback) {
  fetch('/static/products.json')
    .then(resp => resp.json())
    .then(callback);
}


function addProducts(products) {
  let table = new ProductTable('comparetable');

  // Get the fields
  let fields = products.shift();

  let rows = {};

  fields.forEach(field => {
    rows[field] = new ProductRow(table, field);
  });

  // Add all rows to the table
  rows.forEach((field, row) => table.addRow(row));

  // Add all products to the rows
  products.forEach(product => {
    fields.forEach(field => {
      rows[field].addProductData(new ProductData(rows[field], product[field]));
    });


    if (VERIFY_NO_LEFTOVER_KEYS) {
      // Verify there are no leftover keys in this product
      product.keys().forEach(field => {
        if (typeof rows[field] === 'undefined') {
          console.error(`Ignoring field '${field}' from product '${product.name}'`);
        }
      });
    }
  });

  console.log(rows);

  table.sortBy('price', false);
}



function onload() {
  fetchProducts(products => {
    addProducts(products);
  });
}


window.addEventListener('load', onload);

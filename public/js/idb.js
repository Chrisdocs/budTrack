let db;

const request = indexedDB.open('budget_data', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the db
    const db = event.target.result;
    // create an object store (table) called 'new_budget_data', set it to have an auto incrementing id of sorts
    db.createObjectStore('new_budget_data', { autoIncrement: true });
}

// upon a successful
request.onsuccess = function(event) {
    // when the db is successfully created with its object store (from onupgradeneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check to see if app is online, if yes run uploadBudgetData() function to end all local db data to api
    if (navigator.onLine) {
        uploadBudgetData();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new data and there's no internet connection
function saveRecord(record) {
    //open a new transaction with the database with read write permissions
    const transaction = db.transaction(['new_budget_data'], 'readwrite');

    // access the object store for 'new_budget_data'
    const budgetObjectStore = transaction.objectStore('new_budget_data');

    // add record to your store with ass method
    budgetObjectStore.add(record);
};

function uploadBudgetData() {
    // open a transaction on your db
    const transaction = db.transaction(['new_budget_data'], 'readwrite');

    //access your object store
    const budgetObjectStore = transaction.objectStore('new_budget_data');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there was data in the indexDb store, lets send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, test/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json)
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse)
                }
                // open one more transaction
                const transaction = db.transaction(['new_budget_data'], 'readwrite');

                // access to the new_budget_data object store
                const budgetObjectStore = transaction.objectStore('new_budget_data');

                // clear all items in your store
                budgetObjectStore.clear();

                alert('All saved transactions have been submitted!')
            })
            .catch(err => {
            console.log("🚀 ~ file: idb.js ~ line 78 ~ uploadBudgetData ~ err", err);
            })
        } 
    }
}

//listen for app comming n=back online
window.addEventListener('online', uploadBudgetData);
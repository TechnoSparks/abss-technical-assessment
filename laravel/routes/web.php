<?php

use Illuminate\Support\Facades\Route;

// Laravel project serve exclusively as an API endpoint, thus not serving any page
// Look in api.php for API endpoints
Route::get('/', function () {
    abort(404);
});

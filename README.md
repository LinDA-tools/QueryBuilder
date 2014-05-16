Installation
------------

1. Install ruby version manager. 
```sh
rvm http://rvm.io/rvm/install
```
2. Install ruby version 2.0.0 using rvm . 
```sh
rvm install 2.0.0
```
3. Create a separate gemset "qbuilder". 
```sh
rvm gemset create qbuilder
```
4. Use ruby verion 2.0.0 with the created gemset. 
```sh
rvm use 2.0.0@qbuilder
```
5. Install rails. 
```sh
gem install rails
```
6. Install bundle. 
```sh
bundle install
```
<br> 
Now the setup is complete. 

<br>

Start server
------------
```sh
rails s
```


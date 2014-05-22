Installation
------------

Install ruby version manager. 
```sh
\curl -sSL https://get.rvm.io | bash -s stable --ruby
```
Install ruby version 2.0.0 using rvm . 
```sh
rvm install 2.0.0
```
Create a separate gemset "qbuilder". 
```sh
rvm gemset create qbuilder
```
Use ruby verion 2.0.0 with the created gemset. 
```sh
rvm use 2.0.0@qbuilder
```
Install rails. 
```sh
gem install rails
```
Install bundle. 
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


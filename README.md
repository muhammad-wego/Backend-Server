# KSRP Backend Server
## API v1



### Response
Response is in JSON Format, an example is shown below

```
{
    "message" : "Message Here",
    "token" : "G903JMkf0-au321k-g21-kt-1@" 
}
```
### Routes 

#### <u>Login</u>  
#### POST `/api/v1/login`  
Login Route Expects the following parameters
> username : (String) Contains the Username of Admin

> password : (String) Contains the Password

#### <u>Battalion</u>
#### POST `/api/v1/battalion/view/<BATTALION ID>`
View Battalion Details

> `<BATTALION ID>` expects ObjectId of Battalion 
Pass `all` in `<COMPANY ID>` to view all battalions details

#### POST `/api/v1/battalion/add`
Create a Battalion

It expects following Parameters
> battalionNumber : (String) Battalion Number

> location : (String) Location of the Battalion

#### DELETE `/api/v1/battalion/remove`  
Delete a Battalion

It expects the following
> battalionID : (ObjectId) ID of the Battalion

#### <u>Company</u> 
#### POST `/api/v1/company/view/<COMPANY ID>`
View Company Details  

> `<COMPANY ID>` expects ObjectId of Company  
Pass `all` in `<COMPANY ID>` to view all companies details

#### POST `/api/v1/company/add`
Create a Company

It Expects the Following Parameters
> companyName : (String) Contains the Name of Company

> battalion : (ObjectId) Battalion Id

> adminName : (String) Admin Name

> adminUsername : (String) Admin Username

> adminPassword : (String) Admin Password

> location : (String) Location of the Company

#### DELETE `/api/v1/company/remove`
Delete a Company

It Expects the Following Parameters
> companyID : (ObjectId) Company ID

#### POST `/api/v1/company/admin/add`
Adds an Admin to existing Company

It Expects the Following Parameters
> adminUsername : (String) Username of new admin

> adminPassword : (String) Password of new admin

> personnelID : (ObjectId) ID of the Admin as personnel

> battalion : (ObjectId) ID of the Battalion

> company : (ObjectId) ID of the company

#### DELETE `/api/v1/company/admin/remove`
Remove an Admin from Company

It Expects the Following Parameters
> adminID : (ObjectId) ID of the admin to be removed

#### <u>Personnel</u> 
#### POST `/api/v1/personnel/view/<PERSONNEL ID>`
View Personnel Detilas  

> `<PERSONNEL ID>` expects ObjectId of Personnel  
Pass `all` in `<PERSONNEL ID>` to view all companies details, Admin with Priority 1 ONLY.

#### POST `/api/v1/personnel/add`
Create a Personnel

It Expects the Following Parameters
> personnelName : (String) Name of the Personnel

> company : (ObjectId) ID of the Company

> rank : (String) Rank of the Personnel

> metalNo : (String) Metal Number of the Personnel

> dateOfBirth : (String) DOB of the Personnel

#### DELETE `/api/v1/personnel/remove`
Delete a Personnel

It Expects the Following Parameters
> personnelID : (ObjectId) ID of the Personnel

#### <u>healthParameter</u> 
#### POST `/api/v1/healthParameter/view`
View Health Parameters Details  

#### POST `/api/v1/healthParameter/view/add`
Add Health Parameter

It Expects the Following Parameters
> paramName : (String) Name of the Parameter

> lowerRange : (Number) Lower Range

> upperRange : (Number) Upper Range

> normalPresence : (Boolean) Normal Presence

> stages : [{
    name: (String),
    score : (Number)
}] - Array of Objects holding Stage details

#### DELETE `/api/v1/healthParameter/view/remove`
Remove Health Parameter

It Expects the Following Parameters
> healthParamID : (ObjectID) ID Of Param to Delete
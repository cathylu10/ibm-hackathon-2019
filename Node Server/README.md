
## Endpoints:

-[/api/donors](#dUpload) 

-[/api/donors/:firstname/:lastname](#dChange)

### nonpost endpoints
-[/api/donors](#dList) 

-[/api/donors/:firstname/:lastname](#dGet)

-[/api/qdonors](#dQuery)



<a name="dUpload"></a>
#### Parameters - `/api/donors`

Checks if it contains required parameters and uploads donor info to DB


Parameter  | Value |
--|--
First Name  |  `John` **First name*
Last Name | `Smith` **Last name*
Phone Number | `8323456789` *Phone Number*

**Example**

**Could use equivilant translation keys*

```
curl -d '{ "First Name":"John", "Last Name":"Smith","Phone Number":3482374837}' -H "Content-Type: application/json" https://ebd.mybluemix.net/api/donors
```


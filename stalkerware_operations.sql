-- database operations 

-- Statement 1 
select permissions.permission_name, permissions.risk_level, app_permissions.abuse_purpose
from permissions, app_permissions
where permissions.permission_id = app_permissions.permission_id; 

-- Statement 2 
select stalkerware_apps.app_name, stalkerware_apps.platform, stalkerware_apps.release_date, app_ioc.source_reference
from stalkerware_apps, app_ioc
where stalkerware_apps.app_id = app_ioc.app_id; 

-- Statement 3 
select iocs.ioc_type, iocs.ioc_type, iocs.severity_level, iocs.date_identified, app_ioc.relationship_type
from iocs, app_ioc
where iocs.ioc_id = app_ioc.ioc_id; 

-- Statement 4
select stalkerware_apps.app_name, permissions.permission_name, app_permissions.required_or_optional
from stalkerware_apps, app_permissions, permissions
where stalkerware_apps.app_id = app_permissions.app_id and permissions.permission_id = app_permissions.permission_id; 

-- Statement 5 
select stalkerware_apps.app_name, iocs.ioc_type, iocs.ioc_value, iocs.severity_level
from stalkerware_apps, app_ioc, iocs
where stalkerware_apps.app_id = app_ioc.app_id and iocs.ioc_id = app_ioc.ioc_id; 

-- View 1 
create view stalkerware_permissions as 
select permissions.permission_name, permissions.risk_level, app_permissions.abuse_purpose
from permissions, app_permissions
where permissions.permission_id = app_permissions.permission_id; 

-- View 2 
create view stalkerware_data as 
select stalkerware_apps.app_name, stalkerware_apps.platform, stalkerware_apps.release_date, app_ioc.source_reference
from stalkerware_apps, app_ioc
where stalkerware_apps.app_id = app_ioc.app_id; 

-- View 3 
create view ioc_data as 
select iocs.ioc_type, iocs.severity_level, iocs.date_identified, app_ioc.relationship_type
from iocs, app_ioc
where iocs.ioc_id = app_ioc.ioc_id; 

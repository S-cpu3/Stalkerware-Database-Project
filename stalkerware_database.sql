-- database setup script 
DROP DATABASE IF EXISTS stalkerware_iocs; 
create schema stalkerware_iocs; 
use stalkerware_iocs; 

create table stalkerware_apps( 
	app_id int AUTO_INCREMENT Not Null, Primary Key(app_id),  
    app_name varchar(40), 
    platform varchar(40),
    release_date date 
); 

create table iocs(
	ioc_id int AUTO_INCREMENT Not Null, Primary Key(ioc_id),
	ioc_type varchar(40), 
    ioc_value varchar(40), 
    severity_level varchar(40), 
    date_identified date 
); 

create table permissions(
	permission_id int AUTO_INCREMENT Not Null, Primary Key(permission_id),
    permission_name varchar(40), 
    risk_level varchar(40)
); 

create table app_ioc (
	app_ioc_id int AUTO_INCREMENT Not Null, Primary Key(app_ioc_id),
	relationship_type varchar(40), 
	source_reference varchar(40), 
	app_id int, FOREIGN KEY (app_id) REFERENCES stalkerware_apps(app_id), 
    ioc_id int, FOREIGN KEY (ioc_id) REFERENCES iocs(ioc_id) 
); 

create table app_permissions(
	app_permission_id int AUTO_INCREMENT Not Null, Primary Key(app_permission_id),
    required_or_optional varchar(40),  
    abuse_purpose varchar(40), 
    app_id int, FOREIGN KEY (app_id) REFERENCES stalkerware_apps(app_id), 
    permission_id int, FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) 
); 

INSERT INTO stalkerware_apps (app_id, app_name, platform, release_date) VALUES
(1,'FlexiSPY','Android','2021-03-15'),
(2,'mSpy','Android','2020-07-10'),
(3,'Hoverwatch','Android','2019-11-22'),
(4,'Spyera','Android','2021-01-08'),
(5,'Cocospy','Android','2022-05-19'),
(6,'XNSPY','Android','2020-09-14'),
(7,'uMobix','Android','2022-02-25'),
(8,'iKeyMonitor','Android','2019-06-30'),
(9,'TheTruthSpy','Android','2021-08-17'),
(10,'Cerberus','Android','2018-12-05'),
(11,'HighsterMobile','Android','2020-01-11'),
(12,'SpyBubble','Android','2021-06-23'),
(13,'MobileTracker','Android','2019-04-02'),
(14,'Copy9','Android','2020-12-19'),
(15,'TrackMyFone','Android','2022-03-07'),
(16,'Fonemonitor','Android','2021-09-29'),
(17,'GuestSpy','Android','2018-10-13'),
(18,'EasySpy','Android','2020-05-27'),
(19,'PhoneSheriff','Android','2019-08-14'),
(20,'Spyic','Android','2022-07-01');

INSERT INTO iocs (ioc_id, ioc_type, ioc_value, severity_level, date_identified) VALUES
(1,'domain','api.flexispy.com','High','2024-01-12'),
(2,'package_name','com.android.mspy','High','2024-01-18'),
(3,'domain','panel.hoverwatch.com','Medium','2024-02-02'),
(4,'file_hash','a1b2c3d4e5f6g7h8i9j0','High','2024-02-14'),
(5,'ip_address','185.77.88.101','High','2024-02-27'),
(6,'url','xnspy.net/login','Medium','2024-03-05'),
(7,'package_name','com.umobix.service','High','2024-03-16'),
(8,'domain','ikey-track.net','Medium','2024-03-28'),
(9,'ip_address','91.134.22.77','High','2024-04-09'),
(10,'url','cerberus-update.com','High','2024-04-21'),
(11,'domain','spybubble.net','Medium','2024-05-01'),
(12,'package_name','com.copy9.app','High','2024-05-08'),
(13,'ip_address','45.66.77.88','High','2024-05-16'),
(14,'url','trackmyfone.com/panel','Medium','2024-05-25'),
(15,'domain','guestspy.io','Medium','2024-06-03'),
(16,'file_hash','z9y8x7w6v5u4t3s2r1q0','High','2024-06-12'),
(17,'ip_address','102.54.33.21','High','2024-06-21'),
(18,'domain','easyspytracker.com','Medium','2024-06-30'),
(19,'url','phonesheriff.net/login','Medium','2024-07-09'),
(20,'package_name','com.spyic.mobile','High','2024-07-18');

INSERT INTO permissions (permission_id, permission_name, risk_level) VALUES
(1,'READ_SMS','High'),
(2,'ACCESS_FINE_LOCATION','High'),
(3,'RECORD_AUDIO','High'),
(4,'READ_CONTACTS','Medium'),
(5,'READ_CALL_LOG','High'),
(6,'CAMERA','High'),
(7,'READ_EXTERNAL_STORAGE','Medium'),
(8,'ACCESS_BACKGROUND_LOCATION','High'),
(9,'SYSTEM_ALERT_WINDOW','Medium'),
(10,'RECEIVE_BOOT_COMPLETED','Medium'),
(11,'WRITE_EXTERNAL_STORAGE','Medium'),
(12,'READ_PHONE_STATE','High'),
(13,'SEND_SMS','High'),
(14,'ACCESS_WIFI_STATE','Low'),
(15,'ACCESS_NETWORK_STATE','Low'),
(16,'WAKE_LOCK','Low'),
(17,'BLUETOOTH','Low'),
(18,'MODIFY_AUDIO_SETTINGS','Medium'),
(19,'GET_ACCOUNTS','Medium'),
(20,'INTERNET','Low');

INSERT INTO app_ioc (app_ioc_id, relationship_type, source_reference, app_id, ioc_id) VALUES
(1,'communicates_with','ReportA',1,1),
(2,'uses','LabA',2,2),
(3,'communicates_with','FeedA',3,3),
(4,'drops','SandboxA',4,4),
(5,'connects_to','IOCSet1',5,5),
(6,'downloads_from','DB1',6,6),
(7,'uses','MobileNote',7,7),
(8,'communicates_with','Paper1',8,8),
(9,'connects_to','Case1',9,9),
(10,'downloads_from','ReportB',10,10),
(11,'communicates_with','FeedB',11,11),
(12,'uses','LabB',12,12),
(13,'connects_to','IOCSet2',13,13),
(14,'downloads_from','DB2',14,14),
(15,'communicates_with','Paper2',15,15),
(16,'drops','SandboxB',16,16),
(17,'connects_to','Case2',17,17),
(18,'communicates_with','FeedC',18,18),
(19,'downloads_from','ReportC',19,19),
(20,'uses','LabC',20,20);

INSERT INTO app_permissions (app_permission_id, required_or_optional, abuse_purpose, app_id, permission_id) VALUES
(1,'Required','Read SMS',1,1),
(2,'Required','Track location',2,2),
(3,'Required','Record audio',3,3),
(4,'Optional','Read contacts',4,4),
(5,'Required','Call logs',5,5),
(6,'Optional','Take photos',6,6),
(7,'Required','Access files',7,7),
(8,'Required','Background tracking',8,8),
(9,'Optional','Overlay screen',9,9),
(10,'Required','Auto start',10,10),
(11,'Optional','Write storage',11,11),
(12,'Required','Phone state',12,12),
(13,'Required','Send SMS',13,13),
(14,'Optional','WiFi info',14,14),
(15,'Optional','Network info',15,15),
(16,'Optional','Keep awake',16,16),
(17,'Optional','Bluetooth scan',17,17),
(18,'Optional','Audio settings',18,18),
(19,'Optional','Account access',19,19),
(20,'Required','Internet access',20,20);
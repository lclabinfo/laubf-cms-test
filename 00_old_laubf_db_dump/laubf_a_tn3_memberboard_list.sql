-- MySQL dump 10.13  Distrib 8.0.45, for macos15 (arm64)
--
-- Host: localhost    Database: laubf
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `a_tn3_memberboard_list`
--

DROP TABLE IF EXISTS `a_tn3_memberboard_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn3_memberboard_list` (
  `no` int NOT NULL AUTO_INCREMENT,
  `mboard_name` varchar(50) NOT NULL DEFAULT 'memberboard',
  `m_id` varchar(50) DEFAULT NULL,
  `m_name` varchar(50) DEFAULT NULL,
  `m_nick` varchar(50) NOT NULL DEFAULT '',
  `m_pass` varchar(60) DEFAULT NULL,
  `c_name` tinyint NOT NULL DEFAULT '2',
  `m_div` varchar(5) DEFAULT NULL,
  `m_group` varchar(50) DEFAULT NULL,
  `m_level` int NOT NULL DEFAULT '0',
  `m_tempreg` char(1) NOT NULL DEFAULT '1',
  `ad_memo` varchar(255) DEFAULT NULL,
  `recomid` varchar(50) DEFAULT NULL,
  `point1` bigint NOT NULL DEFAULT '0',
  `point2` bigint NOT NULL DEFAULT '0',
  `point3` int NOT NULL DEFAULT '0',
  `wr_def` int NOT NULL DEFAULT '0',
  `wr_repl` int NOT NULL DEFAULT '0',
  `wr_choi` int NOT NULL DEFAULT '0',
  `m_scrap` varchar(255) DEFAULT NULL,
  `del_time` int NOT NULL DEFAULT '0',
  `login_cnt` int NOT NULL DEFAULT '0',
  `last_login` int DEFAULT NULL,
  `m_dat_view` int NOT NULL DEFAULT '0',
  `m_blog` varchar(255) DEFAULT NULL,
  `m_intro` text,
  `m_ip` varchar(20) DEFAULT NULL,
  `m_date` int DEFAULT NULL,
  `m_hint` varchar(50) NOT NULL DEFAULT '',
  `m_mail` varchar(50) NOT NULL DEFAULT '',
  `c_mail` tinyint NOT NULL DEFAULT '2',
  `m_home` varchar(100) DEFAULT NULL,
  `c_home` tinyint NOT NULL DEFAULT '2',
  `jumin` varchar(20) NOT NULL DEFAULT '',
  `wpyan` varchar(20) DEFAULT NULL,
  `sex` tinyint DEFAULT NULL,
  `juso` varchar(255) DEFAULT NULL,
  `c_juso` tinyint NOT NULL DEFAULT '2',
  `tel1` varchar(30) NOT NULL DEFAULT '',
  `c_tel1` tinyint NOT NULL DEFAULT '2',
  `tel2` varchar(30) NOT NULL DEFAULT '',
  `c_tel2` tinyint NOT NULL DEFAULT '2',
  `birth` varchar(15) DEFAULT NULL,
  `c_birth` tinyint NOT NULL DEFAULT '2',
  `clder` tinyint NOT NULL DEFAULT '1',
  `mcharacter` varchar(50) DEFAULT NULL,
  `myphoto` varchar(255) NOT NULL DEFAULT 'login.png',
  `c_myphoto` tinyint NOT NULL DEFAULT '2',
  `myicon` varchar(255) DEFAULT NULL,
  `imgdir` int NOT NULL DEFAULT '1',
  `mailling` tinyint NOT NULL DEFAULT '2',
  `message` tinyint NOT NULL DEFAULT '2',
  `smsok` tinyint NOT NULL DEFAULT '2',
  `memview` tinyint NOT NULL DEFAULT '2',
  `add1` varchar(255) DEFAULT NULL,
  `c_add1` tinyint NOT NULL DEFAULT '2',
  `add2` varchar(255) DEFAULT NULL,
  `c_add2` tinyint NOT NULL DEFAULT '2',
  `add3` varchar(255) DEFAULT NULL,
  `c_add3` tinyint NOT NULL DEFAULT '2',
  `add4` varchar(255) DEFAULT NULL,
  `c_add4` tinyint NOT NULL DEFAULT '2',
  `add5` varchar(255) DEFAULT NULL,
  `c_add5` tinyint NOT NULL DEFAULT '2',
  `add6` varchar(255) DEFAULT NULL,
  `c_add6` tinyint NOT NULL DEFAULT '2',
  `add7` varchar(255) DEFAULT NULL,
  `c_add7` tinyint NOT NULL DEFAULT '2',
  `add8` varchar(255) DEFAULT NULL,
  `c_add8` tinyint NOT NULL DEFAULT '2',
  `add9` varchar(255) DEFAULT NULL,
  `c_add9` tinyint NOT NULL DEFAULT '2',
  `add10` varchar(255) DEFAULT NULL,
  `c_add10` tinyint NOT NULL DEFAULT '2',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`no`),
  KEY `m_id` (`m_id`),
  KEY `m_pass` (`m_pass`),
  KEY `m_name` (`m_name`),
  KEY `m_div` (`m_div`),
  KEY `del_time` (`del_time`),
  KEY `m_group` (`m_group`),
  KEY `m_level` (`m_level`),
  KEY `wr_def` (`wr_def`),
  KEY `wr_repl` (`wr_repl`),
  KEY `m_date` (`m_date`)
) ENGINE=InnoDB AUTO_INCREMENT=3092 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn3_memberboard_list`
--

LOCK TABLES `a_tn3_memberboard_list` WRITE;
/*!40000 ALTER TABLE `a_tn3_memberboard_list` DISABLE KEYS */;
INSERT INTO `a_tn3_memberboard_list` VALUES (2419,'memberboard','joseph','Joseph Cho','Joseph2','k3GH1.RB9eEYE',0,'j',NULL,10,'1','','',0,0,0,1,0,0,NULL,0,83,1536969188,0,'','Joseph입니다. 반갑습니다.','222.22.22.22',1483228174,'','whcho@kookmin.ac.kr',2,'',0,'','',1,'',0,'',0,'',0,'',0,0,'','1570760608.jpeg',0,'',1,2,0,0,0,'LA',1,'',0,'LBCC',0,'LA',2,'Joeph',2,'',2,'PqC0676diz1nsGBKlbRbHjDKzWkIUNUUXSOZaWaHjcYC6NlzrAsSHS1A45nw',0,'America/Los_Angeles',0,'United States',0,'',0,'2022-12-21 03:51:04','2018-04-26 21:32:54'),(3018,'memberboard','cds05187@gmail.com','Yerin','','c0xlR9Si8DRko',2,NULL,NULL,10,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','cds05187@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'1577420790.jpg',2,NULL,1,2,2,2,2,'ETC',2,NULL,2,'',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2019-12-27 12:26:30','2019-06-23 15:51:52'),(3019,'memberboard','Lseu8@cs.com','Seung','','$2y$10$/HUNeBBBwbonJ3PcchhCmO6OcO236JrVcaVehLq22V0i0QKT6dz/i',2,NULL,NULL,5,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','Lseu8@cs.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'LBCC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2019-06-29 23:57:15','2019-06-28 22:33:38'),(3020,'memberboard','davidwanp@gmail.com','David Park','','Y948r1W/xLoE6',2,NULL,NULL,10,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','davidwanp@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'USC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2022-01-14 12:54:17','2019-06-30 03:44:56'),(3021,'memberboard','bcjmepark@gmail.com','Billy Park','','$2y$10$DyBi9UU9ado12zeMJh3MYOrqvIHgLPOK4LN2i92NABarJXEYrqfKm',2,NULL,NULL,5,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','bcjmepark@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2019-07-01 00:39:03','2019-06-30 04:09:44'),(3022,'memberboard','mscfc472@gmail.com','young choi','','$2y$10$HZ4XWgFFUjMHqNb4dJ1wUeTdhztlknq.Xk4aUs8o.kuOwo1u3FGOG',2,NULL,NULL,5,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','mscfc472@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2019-07-06 05:35:42','2019-07-01 02:46:23'),(3023,'memberboard','jkoch7@gmail.com','JASON KOCH','','$2y$10$JARO2CvGMr2OTjrzOHBStu6DjtynbPBHlLzRKRuKKVXmHCn/.V9KK',2,NULL,NULL,5,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','jkoch7@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'VISION',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2019-07-06 05:35:22','2019-07-03 10:24:58'),(3024,'memberboard','danylight@gmail.com','Joseph Cho2','','$2y$12$rbqcy45lpvpnU1WaMY/BPumEElw8CgHdez3xuCOASfQyeGAfrW9SC',2,NULL,NULL,3,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','danylight@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,'oUQ9N1TQEK6qAV3V8aHI71CgE9q2GWcbaBWCm9q1s1iM4efRlU3ohS5n2oBD',2,NULL,2,NULL,2,NULL,2,'2023-12-14 06:31:18','2019-10-11 10:35:23'),(3025,'memberboard','parkrebecca@gmail.com','Rebecca Park','','$2y$10$QSK/vjkpP9HjlJhN7NN5HesbKkW68O61Dl43a.2hKtWpwI5sQa8Oq',2,NULL,NULL,10,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','parkrebecca@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'1571003855.jpg',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'Fullerton',2,NULL,2,NULL,2,NULL,2,'O2sGYC0JkN1w2XagIqcF2R41edxIhJxm5EumvZWgKQJygQCsBXLBXGi8kr3R',2,NULL,2,NULL,2,NULL,2,'2019-10-16 02:16:02','2019-10-14 03:14:06'),(3026,'memberboard','teresapark5145@gmail.com','Teresa Park','','$2y$10$gq.fpKk97HgmXdLi4AbtpOHb07cAxzTBlCk/nRxapfNnoXogu1ZKS',2,NULL,NULL,3,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','teresapark5145@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'LBCC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2019-10-16 10:19:35','2019-10-16 03:14:32'),(3027,'memberboard','djexpressusa@gmail.com','Youngran Chang','','$2y$10$S/cNfRxmcojB9g.52iwHg.FdqqovISPXDYrq4iMXFrHUfFfQX3/4m',2,NULL,NULL,3,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','djexpressusa@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2020-01-20 05:22:59','2019-10-16 04:47:17'),(3028,'memberboard','jvu008@gmail.com','Jennifer Perez','','$2y$10$1OBDmM0h34GONFjDyxVAsekcdkF51pytZDTp5XDLtz2ypTyfgQLwW',2,NULL,NULL,3,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','jvu008@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'Matthew',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2019-10-28 00:44:01','2019-10-16 19:21:52'),(3029,'memberboard','gracehan1674@gmail.com','GRACE HAN','','$2y$10$LiRsiT2EOjOa1Mg/T7OklepT.EeoQd/XTwaqTgtnHPfGizANLce2S',2,NULL,NULL,3,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','gracehan1674@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'Source of Blessing',2,NULL,2,NULL,2,NULL,2,'8CjOsG7sSDvf8M4Jf9Yr9ILMjpSdlk7S5n6jaU2DWcLOszObthp91TZV22jJ',2,NULL,2,NULL,2,NULL,2,'2019-10-28 00:43:55','2019-10-20 01:29:05'),(3030,'memberboard','vision4more@gmail.com','Heather Koch','','$2y$10$a/L0oh7Dw86jITsQZsuRdeuJiORS4cINfl8Xdi3fT9q0hzG.98L/K',2,NULL,NULL,3,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','vision4more@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'Vision Fellowship',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2019-11-08 14:40:04','2019-11-05 23:30:56'),(3031,'memberboard','chun.rebecca@gmail.com','Rebecca M','','$2y$10$H5EoQq8rg7m0FhwnbO9VfuRctky9JTSoaXL.YMNZ3ga4fnIvLKnIm',2,NULL,NULL,3,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','chun.rebecca@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'Rebecks',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2019-11-10 06:39:28','2019-11-07 05:20:31'),(3032,'memberboard','jamesyum3@gmail.com','jae Yu','','$2y$10$nMCifYoOY0rc4kVOTmWpp.eQp9QZc2VM0uaZv02HS8eRaPankByTu',2,NULL,NULL,1,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','jamesyum3@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2020-04-13 00:33:03','2020-03-22 09:44:43'),(3033,'memberboard','leo.alexanderg1999@gmail.com','Leo','','$2y$10$LwpUbuOU3lht6FE5Lv00ReaJjPF.cbqklp37c4FXGzP98aN7c5.U.',2,NULL,NULL,1,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','leo.alexanderg1999@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2020-04-13 00:33:07','2020-03-30 01:05:24'),(3034,'memberboard','joseph.whcho@gmail.com','Joseph Cho','','k34BJz4J7/KQ6',2,NULL,NULL,10,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','joseph.whcho@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'1586712959.jpeg',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'LBCC',2,NULL,2,NULL,2,NULL,2,'RHkr6B3vwk4O5wvqafcwh362KvBM2zUy49DsZDHZLsv781GT7gJZkhPC2TaW',2,NULL,2,NULL,2,NULL,2,'2021-02-03 02:14:57','2020-04-13 00:33:54'),(3035,'memberboard','lillia2@yahoo.com','Lillia Michaud','','$2y$10$0W3oDGxgLYvcSNtIQMLofeapYPXGeny6naR5WSx483GUZYDgKo2UK',2,NULL,NULL,1,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','lillia2@yahoo.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2020-04-13 04:35:19','2020-04-13 02:18:18'),(3036,'memberboard','rfishman2@gmail.com','Robert L Fishman','','$2y$10$YyW2m3xsyhfgFbS3VgIH8uFMsL9UnCcoxiIKmP085NV99a6Ydam0y',2,NULL,NULL,1,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','rfishman2@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'Long Beach State',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2020-04-15 06:56:59','2020-04-15 06:38:32'),(3037,'memberboard','almondblossom72@gmail.com','Maria Oh','','$2y$10$X4i4ofjNW/sOIfyu8UBwL.6Qx.OI.FesdL8TPbLJk42uFO5pO5msq',2,NULL,NULL,1,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','almondblossom72@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,'tILsSmIJKSsrmqtAebKK5pkpQZy4N2Wpz3SYQWtY4Me2V7PSqC6Q1U7A1URs',2,NULL,2,NULL,2,NULL,2,'2020-04-17 10:33:41','2020-04-16 12:04:10'),(3038,'memberboard','susanna2237@gmail.com','Sangim Lee','','$2y$10$8mInX0lKs86cKHPP0kOliOLI70w.hXKKp2fceaD8ODZHziNLDBjMy',2,NULL,NULL,1,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','susanna2237@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2020-11-01 01:28:16','2020-05-04 02:08:54'),(3039,'memberboard','dchung3115@gmail.com','David H Chung','','$2y$10$.szF/zkBTG3LHCrfa0Kz/unJSeVOCUcV9YMWJL2yOSL2q7.ez225y',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','dchung3115@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'George Mason',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2020-05-04 02:37:33','2020-05-04 02:37:33'),(3040,'memberboard','lisethtatiana3@gmail.com','Tatiana Liseth','','$2y$10$cdkY0sbhhy4hLHkJ2pmdYOSPzYUBKWIW0WtSoxatHnMbltvsjhLP.',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','lisethtatiana3@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2020-06-04 17:57:03','2020-06-04 17:57:03'),(3042,'memberboard','Pd154@hanmail.net','Keong Cha','','$2y$10$9zIQ7pB55z2UpSUtf3QldOdK0zyZ2BF1TKQTSJ70coXAxtuhxggjy',2,NULL,NULL,1,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','Pd154@hanmail.net',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2020-11-01 01:27:32','2020-09-05 10:55:10'),(3043,'memberboard','laubf.downey@gmail.com','LA UBF','','$2y$10$3eERDpfV1Lb8H5VvMmhMx.74vlyNWjhBSIfE/qp6aQwOZQCsXGBqu',2,NULL,NULL,5,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','laubf.downey@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'Admin',2,NULL,2,NULL,2,NULL,2,'mWdY2hfsh0LVOvXTAAx4dNwFtyx19SFuAV0n1yyzLpgmfyYYMAPtEtFSpG6P',2,NULL,2,NULL,2,NULL,2,'2020-11-01 01:25:15','2020-09-06 05:55:42'),(3050,'memberboard','jvperez13@gmail.com','Juan Perez','','$2y$10$OGXoxzw9cGxnkv6eegcg3egvt66jFkF3tRr1BSRHGMty75MuZyAzS',2,NULL,NULL,5,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','jvperez13@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'Mathew Fellowship',2,NULL,2,NULL,2,NULL,2,'KyOVAX5W9a5GZT7Gfi5mrCHPlFY2KPXNTXjbOfZkcW64by9EY3MPRlJXWl4O',2,NULL,2,NULL,2,NULL,2,'2023-10-02 02:51:56','2021-02-15 04:40:25'),(3063,'memberboard','williamjlarsen@gmail.com','William Larsen','','$2y$10$lb9rmcOI8cbvO1d20wH0ou.M4D.QWfAm5zu/YVWoY9ORqwWLkx3lC',2,NULL,NULL,10,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','williamjlarsen@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,'VPWLZzUeHlwBzYOT4hKoa6s08PYsZOCVXQ8vlLVDxPlztv4cpWTAyGba6nxa',2,NULL,2,NULL,2,NULL,2,'2022-02-19 02:00:08','2022-01-17 14:23:02'),(3065,'memberboard','globalchoibi@hanmail.net','Choibi','','$2y$10$ZTidEkYdSFhskcn7PYeOLe6OLiOCdj0bBu5GYk4Cg/voorNGcrSYi',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','globalchoibi@hanmail.net',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2022-02-28 13:28:26','2022-02-28 13:28:26'),(3077,'memberboard','joannm5j@outlook.com','UxvVGHgoyM','','$2y$10$Gmi6udzZMkUnOLwlx31uNuAvtbVolLSrCgPyP5QKtlCJD6FXXkKei',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','joannm5j@outlook.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,'wWpbdGDUF0IU4IgeJqLtoeT8orW2d9DU351V2ZRCtcQ2aymp3A7CrQpLgcnL',2,NULL,2,NULL,2,NULL,2,'2023-01-25 09:26:11','2023-01-25 09:25:27'),(3078,'memberboard','p.sweetrain@gmail.com','Danbee Park','','$2y$10$DMcNvrSuo5X5b/eYYg68XukkDxfdvsJahMXsnaQo3O9gyTtHeBxp6',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','p.sweetrain@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-02-11 08:47:20','2023-02-11 08:47:20'),(3079,'memberboard','jpark90241@yahoo.com','James Park Sr. ','','$2y$10$IAqPjt7DYf8jJD3dhrTdcO.lnjhwuWGr7ZVcbnE25G3y3BwBdXTy2',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','jpark90241@yahoo.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-03-04 12:38:46','2023-03-04 12:38:46'),(3080,'memberboard','crotdiasu1987@mail.ru','Пeрейдuте по сcылке и получuтe доступ k пpоеkту с ','','$2y$10$oRtqlY2uMMHCvNyoMefZ1uDJbH8OCIhNC/bx.ZfHAvs.Q6azeLCBW',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','crotdiasu1987@mail.ru',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-08-03 11:39:17','2023-08-03 11:39:17'),(3081,'memberboard','credwale1987+1@mail.ru','4n389 Сдeлaйтe слeдующий шаг к фuнaнcовой cта6ильн','','$2y$10$AodKwQJESU8dfwAe/m9UyeyDWIpyz/bkhiO/E9vtf0SSQeXx2/hra',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','credwale1987+1@mail.ru',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-08-10 21:52:17','2023-08-10 21:52:17'),(3082,'memberboard','mdjs0721@gmail.com','Jeongsoo Park','','$2y$10$mc1nHBTeJwYmvQ2O.4nNHe/HWHb08vsh/MmCtrlVz6PAIRMy5u2nG',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','mdjs0721@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-10-06 08:36:30','2023-10-06 08:36:30'),(3083,'memberboard','preetiuoadhyay2017@gmail.com','Preeti Uoadhyay ','','$2y$10$EC/vQmnKRU05LIIArEBELuFORGlRuO8URHtAbs..czB/9mwbV6E9G',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','preetiuoadhyay2017@gmail.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'CMI',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-10-27 20:50:22','2023-10-27 20:50:22'),(3084,'memberboard','cJJRwy.dqqwhh@rottack.biz','czCamlIvXpyusT','','$2y$10$zK76zdbnTewVy8vxMHFapeSIHCrhQjU99hkesYwZ658tS5miiTkn.',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','cJJRwy.dqqwhh@rottack.biz',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-11-10 12:02:44','2023-11-10 12:02:44'),(3085,'memberboard','rBifeL.bphhqc@monochord.xyz','mfNRxPbrhK','','$2y$10$GIeuJbkWUCadGs1MnogPKukuBmXJ4oNQXRlsdtlZ9P36wMBQvQekC',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','rBifeL.bphhqc@monochord.xyz',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-11-19 00:01:39','2023-11-19 00:01:39'),(3086,'memberboard','mBxuQm.pqqwtm@sabletree.foundation','vBnjqerVaFC','','$2y$10$WFSRvAXLHmDvCHahZhf1medsFitSvS09H3jx9I8ZRZWQmiVFTxrY6',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','mBxuQm.pqqwtm@sabletree.foundation',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-11-24 06:45:43','2023-11-24 06:45:43'),(3087,'memberboard','vuxcebewof@outlook.com','mdoHMUNgp','','$2y$10$VZardJ1CY4zzRSTxQHT.Aur1VviCYwXTAwTof.2g4ZOuANRTrDjSu',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','vuxcebewof@outlook.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,'09C9ei5BzZTc78xk1iMBilVyPDZvjZGyN8s5EuLpKSN6OmvqIYXOzSDXAVuM',2,NULL,2,NULL,2,NULL,2,'2023-11-29 15:29:34','2023-11-29 15:29:29'),(3088,'memberboard','kySArh.dtmwhtt@zetetic.sbs','FQHyoSVqxRo','','$2y$10$EyxA0Eu8smwiewaOf9Bzy.MQgWuBePJ7uoiedXPGE5Sd3QDUkVOTe',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','kySArh.dtmwhtt@zetetic.sbs',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-12-02 14:26:33','2023-12-02 14:26:33'),(3089,'memberboard','vyacheslavzwdaks@outlook.com','RyvXmHuEaNkKFMij','','$2y$10$LbcC8mpEUB7zxkKVgVyveeeEHLq.wiRz0EAJRUXCs5W/D5Vyyf/MC',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','vyacheslavzwdaks@outlook.com',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,'4dZRbpnloqEMNfdw7pbeI6JpaBHEgef6AN6oDnAr0VBLuwks1E1A1a26YDjN',2,NULL,2,NULL,2,NULL,2,'2023-12-06 19:46:43','2023-12-06 19:46:06'),(3090,'memberboard','RQFCHC.tbddwdp@gemination.hair','Chandler','','$2y$10$shHHAf1Ybsn1K9vOaWiznenm3Z9ORUvueU8bu5SCDMc/w.OcoDqHq',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','RQFCHC.tbddwdp@gemination.hair',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,'ETC',2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-12-10 19:11:42','2023-12-10 19:11:42'),(3091,'memberboard',NULL,'Test','','$2y$12$N25.HI5y91inCULpN0M7iO7kQwKbJScJO2N2id0Hucs7Cx7ZESvPC',2,NULL,NULL,0,'1',NULL,NULL,0,0,0,0,0,0,NULL,0,0,NULL,0,NULL,NULL,NULL,NULL,'','josephcho@lclab.io',2,NULL,2,'',NULL,NULL,NULL,2,'',2,'',2,NULL,2,1,NULL,'login.png',2,NULL,1,2,2,2,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,NULL,2,'2023-12-14 13:39:26','2023-12-14 13:39:26');
/*!40000 ALTER TABLE `a_tn3_memberboard_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:12:42

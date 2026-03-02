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
-- Table structure for table `a_tn2_mobtalk_cnt`
--

DROP TABLE IF EXISTS `a_tn2_mobtalk_cnt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_mobtalk_cnt` (
  `no` int NOT NULL AUTO_INCREMENT,
  `b_name` varchar(255) NOT NULL DEFAULT 'tmp',
  `b_nick` varchar(255) DEFAULT NULL,
  `t_year` int NOT NULL DEFAULT '0',
  `t_mon` int NOT NULL DEFAULT '0',
  `t_day` int NOT NULL DEFAULT '0',
  `t_week` int NOT NULL DEFAULT '0',
  `t_time` int NOT NULL DEFAULT '0',
  `c_total` int NOT NULL DEFAULT '0',
  `m_alam` tinyint DEFAULT NULL,
  `m_memo` varchar(255) DEFAULT NULL,
  `m_text` text,
  `wr_std` int NOT NULL DEFAULT '0',
  `wr_rep` int NOT NULL DEFAULT '0',
  `wr_mrep` int NOT NULL DEFAULT '0',
  `sh_words` mediumtext,
  `ref_url` mediumtext,
  `ref_ip` mediumtext,
  `ref_id` mediumtext,
  `ref_name` mediumtext,
  `done_order` int NOT NULL DEFAULT '2',
  `MSIE_6` int NOT NULL DEFAULT '0',
  `MSIE_7` int NOT NULL DEFAULT '0',
  `MSIE_8` int NOT NULL DEFAULT '0',
  `MSIE_9` int NOT NULL DEFAULT '0',
  `MSIE_10` int NOT NULL DEFAULT '0',
  `Firefox` int NOT NULL DEFAULT '0',
  `Chrome` int NOT NULL DEFAULT '0',
  `Safari` int NOT NULL DEFAULT '0',
  `BW_etc` int NOT NULL DEFAULT '0',
  `Win_2k` int NOT NULL DEFAULT '0',
  `Win_xp` int NOT NULL DEFAULT '0',
  `Win_vis` int NOT NULL DEFAULT '0',
  `Win_7` int NOT NULL DEFAULT '0',
  `Win_etc2` int NOT NULL DEFAULT '0',
  `Sun_sol` int NOT NULL DEFAULT '0',
  `Linux` int NOT NULL DEFAULT '0',
  `Unix_st` int NOT NULL DEFAULT '0',
  `Macintosh` int NOT NULL DEFAULT '0',
  `Andro` int NOT NULL DEFAULT '0',
  `Iphon` int NOT NULL DEFAULT '0',
  `MobileOS` int NOT NULL DEFAULT '0',
  `OS_etc1` int NOT NULL DEFAULT '0',
  `hou0` int NOT NULL DEFAULT '0',
  `hou1` int NOT NULL DEFAULT '0',
  `hou2` int NOT NULL DEFAULT '0',
  `hou3` int NOT NULL DEFAULT '0',
  `hou4` int NOT NULL DEFAULT '0',
  `hou5` int NOT NULL DEFAULT '0',
  `hou6` int NOT NULL DEFAULT '0',
  `hou7` int NOT NULL DEFAULT '0',
  `hou8` int NOT NULL DEFAULT '0',
  `hou9` int NOT NULL DEFAULT '0',
  `hou10` int NOT NULL DEFAULT '0',
  `hou11` int NOT NULL DEFAULT '0',
  `hou12` int NOT NULL DEFAULT '0',
  `hou13` int NOT NULL DEFAULT '0',
  `hou14` int NOT NULL DEFAULT '0',
  `hou15` int NOT NULL DEFAULT '0',
  `hou16` int NOT NULL DEFAULT '0',
  `hou17` int NOT NULL DEFAULT '0',
  `hou18` int NOT NULL DEFAULT '0',
  `hou19` int NOT NULL DEFAULT '0',
  `hou20` int NOT NULL DEFAULT '0',
  `hou21` int NOT NULL DEFAULT '0',
  `hou22` int NOT NULL DEFAULT '0',
  `hou23` int NOT NULL DEFAULT '0',
  `tmp_1` int NOT NULL DEFAULT '0',
  `tmp_2` int NOT NULL DEFAULT '0',
  `tmp_3` int NOT NULL DEFAULT '0',
  `tmp_4` int NOT NULL DEFAULT '0',
  `tmp_5` int NOT NULL DEFAULT '0',
  `tmp_v1` varchar(255) DEFAULT NULL,
  `tmp_v2` varchar(255) DEFAULT NULL,
  `tmp_v3` varchar(255) DEFAULT NULL,
  `tmp_v4` varchar(255) DEFAULT NULL,
  `tmp_v5` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`no`),
  KEY `t_year` (`t_year`),
  KEY `t_mon` (`t_mon`),
  KEY `t_day` (`t_day`),
  KEY `t_week` (`t_week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_mobtalk_cnt`
--

LOCK TABLES `a_tn2_mobtalk_cnt` WRITE;
/*!40000 ALTER TABLE `a_tn2_mobtalk_cnt` DISABLE KEYS */;
/*!40000 ALTER TABLE `a_tn2_mobtalk_cnt` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:04:58

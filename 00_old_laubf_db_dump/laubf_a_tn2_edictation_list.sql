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
-- Table structure for table `a_tn2_edictation_list`
--

DROP TABLE IF EXISTS `a_tn2_edictation_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_edictation_list` (
  `no` int NOT NULL AUTO_INCREMENT,
  `board_name` varchar(50) NOT NULL DEFAULT 'edictation',
  `uid` double NOT NULL DEFAULT '0',
  `division` int NOT NULL DEFAULT '1',
  `thread` int NOT NULL DEFAULT '0',
  `parent` int DEFAULT NULL,
  `follow` int DEFAULT NULL,
  `replycnt` tinyint NOT NULL DEFAULT '0',
  `no_reply` tinyint DEFAULT NULL,
  `mlevel` int DEFAULT NULL,
  `member` tinyint DEFAULT NULL,
  `micon` varchar(255) DEFAULT NULL,
  `mphoto` varchar(255) DEFAULT NULL,
  `mcharacter` varchar(50) DEFAULT NULL,
  `comment` smallint NOT NULL DEFAULT '0',
  `comment2` smallint NOT NULL DEFAULT '0',
  `mnick` varchar(50) NOT NULL DEFAULT '',
  `vote` int NOT NULL DEFAULT '0',
  `ip` varchar(15) DEFAULT NULL,
  `wdate` int DEFAULT NULL,
  `wdate_re` int DEFAULT NULL,
  `hit` int NOT NULL DEFAULT '0',
  `specialset` varchar(10) DEFAULT NULL,
  `give_point` mediumint DEFAULT NULL,
  `re_select` tinyint DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `category` tinyint NOT NULL DEFAULT '0',
  `name` varchar(50) NOT NULL DEFAULT '',
  `id` varchar(50) NOT NULL DEFAULT '',
  `wmail` varchar(50) NOT NULL DEFAULT '',
  `home` varchar(255) DEFAULT NULL,
  `bodytype` char(1) DEFAULT NULL,
  `bodystyle` varchar(255) DEFAULT NULL,
  `mypass` varchar(50) NOT NULL DEFAULT '',
  `secret` int NOT NULL DEFAULT '0',
  `openerid` varchar(255) DEFAULT NULL,
  `tbody` text,
  `tbody_img` text,
  `sms_tel` varchar(20) DEFAULT NULL,
  `ulink1` varchar(255) DEFAULT NULL,
  `ulink1size` int DEFAULT NULL,
  `ulink1hit` int NOT NULL DEFAULT '0',
  `ulink2` varchar(255) DEFAULT NULL,
  `ulink2size` int DEFAULT NULL,
  `ulink2hit` int NOT NULL DEFAULT '0',
  `filedir` int DEFAULT NULL,
  `ufile1` varchar(150) DEFAULT NULL,
  `ufile1size` int DEFAULT NULL,
  `ufile1hit` int NOT NULL DEFAULT '0',
  `ufile2` varchar(150) DEFAULT NULL,
  `ufile2size` int DEFAULT NULL,
  `ufile2hit` int NOT NULL DEFAULT '0',
  `temp1` int DEFAULT NULL,
  `temp2` int DEFAULT NULL,
  `temp3` mediumtext,
  `user_add1` varchar(255) DEFAULT NULL,
  `user_add2` varchar(255) DEFAULT NULL,
  `user_add3` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`no`),
  KEY `uid` (`uid`),
  KEY `division` (`division`),
  KEY `follow` (`follow`),
  KEY `category` (`category`),
  KEY `name` (`name`),
  KEY `id` (`id`),
  KEY `hit` (`hit`),
  KEY `wdate` (`wdate`),
  KEY `comment` (`comment`),
  KEY `replycnt` (`replycnt`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_edictation_list`
--

LOCK TABLES `a_tn2_edictation_list` WRITE;
/*!40000 ALTER TABLE `a_tn2_edictation_list` DISABLE KEYS */;
INSERT INTO `a_tn2_edictation_list` VALUES (1,'edictation',-1,1,0,NULL,1,0,NULL,NULL,1,NULL,NULL,NULL,0,0,'Joseph3',0,'222.22.22.22',1486964271,NULL,2,NULL,NULL,NULL,'Matt 2',0,'WonheeCho','joseph','Joseph3@test.com',NULL,NULL,NULL,'k3GH1.RB9eEYE',0,'joseph','1. After Jesus was born in Bethlehem in Judea, during the time of King Herod, Magi\r\n2. and asked, \\\"Where is the one who has been born king of the Jews? We saw his star when it rose and have come to worship him.\r\n3. When King Herod heard this he was disturbed, and all Jerusalem with him.\r\n4. When he had called together all the people\\\'s chief priests and teachers of the law, he asked them where the Messiah was to be born.\r\n5. In Bethlehem in Judea, they replied, for this is what the prophet has written:\r\n6. But you, Bethlehem, in the land of Judah, are by no means least among the rulers of Judah; for out of you will come a ruler who will shepherd my people Israel.\r\n7. Then Herod called the Magi secretly and found out from them the exact time the star had appeared.\r\n8. He sent them to Bethlehem and said, God and search carefully for the child, As soon as you find him, report to me, so that I too may go and worship him.\r\n9. After they had heard the king, they went on their way, and the star they had seen when it rose went ahead of them until it stopped over the place where the child was,\r\n10. When they saw the star, they were overjoyed.\r\n11. On coming to the house, they saw the child with his mother Mary. and they bowed down and worshiped him. Then they opened their treasures and presented him with gitfs of gold, frankincense and myrrh.\r\n12. And having been warned in a dream not to go back to Herod, they returned to their country by another route.\r\n13. When they had gone, and angel of the Lord appeared to Joseph in a dream. Get up, he said, take the child and his mother and escape to Egypt. Stay there until I tell you, for Herod is going to search for the child to kill him.\r\n14. So he got up, took the child and his mother during the night and left for Egypt,\r\n15. where he stayed until the death of Herod, And so was fulfilled what the Lord had said through the prophet: Out of Egypt I called my son.\r\n16. When Herod realized that he had been outwitted by the Magi, he was furious, and he gave orders to kill all the boys in Bethlehem and its vicinity who were two years old and under, in accordance with the time he had learned from the Magi.\r\n17. Then what was said through the prophet Jeremiah was fulfilled:\r\n18. A voice is heard in Ramah, weeping and great mourning, Rachel weeping for her children and refusing to be comforted, because they are no more.\r\n',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `a_tn2_edictation_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:06:32

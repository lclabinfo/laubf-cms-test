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
-- Table structure for table `a_tn2_mobtalk_list`
--

DROP TABLE IF EXISTS `a_tn2_mobtalk_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_mobtalk_list` (
  `no` int NOT NULL AUTO_INCREMENT,
  `board_name` varchar(50) NOT NULL DEFAULT 'mobtalk',
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_mobtalk_list`
--

LOCK TABLES `a_tn2_mobtalk_list` WRITE;
/*!40000 ALTER TABLE `a_tn2_mobtalk_list` DISABLE KEYS */;
INSERT INTO `a_tn2_mobtalk_list` VALUES (1,'mobtalk',-1,1,0,NULL,1,0,NULL,1,NULL,NULL,NULL,NULL,0,0,'',0,'120.53.41.22',1300757606,NULL,5,NULL,NULL,NULL,'?꾧뎔媛??섏뿉寃?臾쇱뿀?',6,'源?쥌?','','',NULL,NULL,NULL,'',0,NULL,'?꾧뎔媛??섏뿉寃?臾쇱뿀???쒓? 萸먮깘怨?\n?섎뒗 ?쒖씤??紐??⑥쑝濡???紐⑤Ⅸ?ㅺ퀬 ??떟?섏???\r\n臾닿탳?숆낵 醫낅줈??紐낅룞怨??⑥궛怨??쒖슱???욎쓣 嫄몄뿀??\r\n??뀅???⑤?臾??쒖옣 ?덉뿉??\n鍮덈??≪쓣 癒뱀쑝硫댁꽌 ?앷컖?섍퀬 ?덉뿀??\r\n洹몃윴 ?щ엺?ㅼ씠 ?꾩껌??怨좎깮???섏뼱??\n?쒗븯怨?紐낅옉?섍퀬 留?醫뗪퀬 ?몄젙??\n?덉쑝誘?줈 ?ш린濡?쾶 ?щ뒗 ?щ엺?ㅼ씠\r\n洹몃윴 ?щ엺?ㅼ씠 ???몄긽?먯꽌 ?뚰뙆?닿퀬\r\n怨좉????몃쪟?닿퀬 ?곸썝??愿묐챸?닿퀬\r\n?ㅻ쫫 ?꾨땶 ?쒖씤?대씪怨',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL),(2,'mobtalk',-2,1,0,NULL,2,0,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'',0,'120.53.41.22',1300757607,NULL,8,NULL,NULL,NULL,'?ㅺ컝??留덉쓣???대━???',1,'源?텣?','','',NULL,NULL,NULL,'',0,NULL,'?ㅺ컝??留덉쓣?먮뒗 ?쇱썡(訝됪쐢)???덉씠 ?⑤떎.\r\n遊꾩쓣 諛붾씪怨??곕뒗 ?щ굹?댁쓽 愿?옄??씠??\n?덈줈 ?뗭? ?뺣㎘??\r\n諛붾Ⅴ瑜??ㅻ떎.\r\n諛붾Ⅴ瑜대뼚???щ굹?댁쓽 愿?옄??씠??\n?덈줈 ?뗭? ?뺣㎘???대（留뚯?硫?\n?덉? ?섏쿇 ?섎쭔???좉컻瑜??ш퀬\r\n?섎뒛?먯꽌 ?대젮???ㅺ컝??留덉쓣??\n吏?텞怨?援대슍????뒗??\r\n?쇱썡???덉씠 ?ㅻ㈃\r\n?ㅺ컝??留덉쓣??伊먮삦留뚰븳 寃⑥슱 ?대ℓ?ㅼ?\r\n?ㅼ떆 ?щ━釉뚮튆?쇰줈 臾쇱씠 ?ㅺ퀬\r\n諛ㅼ뿉 ?꾨굺?ㅻ뱾??\n洹??댁쓽 ?쒖씪 ?꾨쫫?ㅼ슫 遺덉쓣\r\n?꾧턿?댁뿉 吏???',NULL,NULL,'img/member/money.gif',NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL),(3,'mobtalk',-3,1,0,0,3,0,0,9,1,NULL,NULL,NULL,0,0,'?댄샇?',0,'192.168.10.100',1300757608,0,3,NULL,0,0,'?닿뎄苑???留덉쓣',6,'?댄샇?','','',NULL,NULL,NULL,'ksqPNLSSHFaRU',0,'korea','?닿뎄苑???留덉쓣???대뵒??怨좏뼢 媛숇떎.\r\n留뚮굹???щ엺留덈떎 ?깆씠?쇰룄 移섍퀬吏?퀬,\r\n?섏쭛???ㅼ뼱?쒕㈃??諛섍꺼 ?꾨땲 留욎쑝由?\r\n\r\n諛붾엺?녿뒗 諛ㅼ쓣 苑?洹몃뒛???ъ씠 ?ㅻ㈃\r\n???듬뒗 珥덈떦(?됧쟼)留덈떎 ?뺤씠 ?붿슧 ?듭쑝由щ땲\r\n?섍렇????Т???좎뿉??留덉쓬 ?꾨땲 諛붾튌??',NULL,NULL,'img/character/person50.gif',0,0,NULL,0,0,0,NULL,0,0,NULL,0,0,0,0,NULL,NULL,NULL,NULL),(4,'mobtalk',-4,1,0,NULL,4,0,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'',0,'120.53.41.22',1300757609,0,6,NULL,NULL,NULL,'?몄쓬????뒗 媛?쓣 媛',1,'諛뺤옱?','','',NULL,NULL,NULL,'',0,NULL,'留덉쓬???쒖옄由?紐??됱븘 ?덈뒗 留덉쓬????\r\n移쒓뎄???쒕윭???щ옉 ?댁빞湲곕?\r\n媛?쓣 ?뉖퀡?쇰줈???숇Т ?쇱븘 ?곕씪媛?㈃,\r\n?대뒓???깆꽦?댁뿉 ?대Ⅴ???덈Ъ?섍퀬??\r\n\r\n?쒖궭???곗쭛??紐⑥씠??遺덈튆??遺덈튆?댁?留?\n?댁쭏???몄쓬????뒗 媛?쓣媛?黎???蹂닿쾬??\r\n\r\n??쾬 遊? ??쾬 遊?\n?ㅻ낫?대룄 ?대낫?대룄\r\n洹?湲곗걶 泥レ궗???곌낏臾??뚮━媛??щ씪吏?퀬\r\n洹??ㅼ쓬 ?щ옉 ?앹뿉 ?앷릿 ?몄쓬源뚯? ?뱀븘?섍퀬\r\n?댁젣??誘몄튌 ???섎굹濡?諛붾떎??????媛?뒗\r\n?뚮━ 二쎌? 媛?쓣 媛뺤쓣 泥섏쓬 蹂닿쾬??',NULL,NULL,'img/character/animal07.gif',NULL,0,NULL,NULL,0,1,NULL,0,0,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL),(5,'mobtalk',-5,1,0,0,5,0,0,0,0,NULL,NULL,NULL,0,0,'',0,'120.53.41.22',1300757610,0,3,NULL,0,0,'?몃늿諛뺤씠 臾쇨퀬湲곗쓽 ?щ옉',1,'瑜섏떆?','','',NULL,NULL,NULL,'',0,NULL,'?몃늿諛뺤씠 臾쇨퀬湲곗쿂???닿퀬 ?띕떎.\r\n?몃늿諛뺤씠 臾쇨퀬湲곗쿂??\n?щ옉?섍퀬 ?띕떎.\r\n\r\n?먮늿諛뺤씠 臾쇨퀬湲곗쿂???몄긽???닿린 ?꾪빐\r\n?됱깮????留덈━媛??④퍡 遺숈뼱 ?ㅻ뀛?ㅻ뒗\r\n?몃늿諛뺤씠 臾쇨퀬湲?鍮꾨ぉ泥섎읆 \r\n?щ옉?섍퀬 ?띕떎.\r\n\r\n?곕━?먭쾶 ?쒓컙??異⑸텇?덈떎 洹몃윭??\n?곕━??洹몃쭔???щ옉?섏? ?딆븯??肉?\n?몃늿諛뺤씠 臾쇨퀬湲곗쿂??\n洹몃젃寃??닿퀬 ?띕떎.\r\n\r\n?쇱옄 ?덉쑝硫?\r\n洹??쇱옄 ?덉쓬??湲덈갑 ?ㅼ폒 踰꾨━??\n?몃늿諛뺤씠 臾쇨퀬湲?鍮꾨ぉ泥섎읆\r\n紐⑹닲???ㅽ빐 ?щ옉?섍퀬 ?띕떎.',NULL,NULL,'img/editor_bg/bg004.jpg',0,0,NULL,0,0,0,NULL,0,0,NULL,0,0,0,0,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `a_tn2_mobtalk_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:05:07

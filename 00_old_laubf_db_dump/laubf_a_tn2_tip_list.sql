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
-- Table structure for table `a_tn2_tip_list`
--

DROP TABLE IF EXISTS `a_tn2_tip_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_tip_list` (
  `no` int NOT NULL AUTO_INCREMENT,
  `board_name` varchar(50) NOT NULL DEFAULT 'tip',
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_tip_list`
--

LOCK TABLES `a_tn2_tip_list` WRITE;
/*!40000 ALTER TABLE `a_tn2_tip_list` DISABLE KEYS */;
INSERT INTO `a_tn2_tip_list` VALUES (20,'tip',-20,1,0,0,20,0,0,1,1,'','','',0,0,'愿?━?',3,'222.22.22.22',1423378053,0,400,'',0,0,'[Light踰꾩쟾?뚭컻] 援?珥덇린?붾㈃怨??좎궗??硫붾돱泥닿퀎??濡쒕뵫?띾룄媛??쎄컙 ??鍮좊Ⅸ ?쇱씠?몃쾭???ъ슜諛⑸쾿???뚭컻?⑸땲??',0,'愿?━?','bible','danylight@hanmail.net','','5','','k3GH1.RB9eEYE',0,'danycho','<span style=\\\"font-family: 援대┝, Tahoma; font-size: 9pt; line-height: 1.5; background-color: rgb(255, 255, 255);\\\"><font face=\\\"Nanum Gothic\\\"><span style=\\\"font-size: 15px; line-height: 19.5px;\\\">[Light踰꾩쟾?뚭컻] 援?珥덇린?붾㈃怨??좎궗??硫붾돱泥닿퀎??濡쒕뵫?띾룄媛??쎄컙 ??鍮좊Ⅸ ?쇱씠?몃쾭?꾩쓣 ?ъ슜?섏떆?ㅻ㈃ ?섍꼍?ㅼ젙?먯꽌 [</span></font></span><a href=\\\"http://bs.ubf.kr/bible/login-check.php?em_id=GAQPBAA=&m_name=Prayer&m_chapter=%BA%CF%BE%C7&c_num=3&r_url=env_soption\\\" target=\\\"_top\\\" class=\\\"ui-link\\\" style=\\\"color: black; text-decoration: none; font-family: \\\'Nanum Gothic\\\'; font-size: 15px; line-height: 19.5px; background-color: rgb(255, 255, 51);\\\"><img src=\\\"http://bs.ubf.kr/bible/icons/02_myupdate.png\\\" width=\\\"25\\\" height=\\\"25\\\" align=\\\"center\\\" style=\\\"border-width: 0px;\\\">App踰꾩쟾 ?좏깮</a><span style=\\\"font-family: \\\'Nanum Gothic\\\'; font-size: 15px; line-height: 19.5px; background-color: rgb(255, 255, 255);\\\">]???꾨Ⅴ?쒓퀬 Light Style???좏깮?섍퀬 ??옣?섏떆硫??⑸땲??</span>','','','',0,0,'',0,0,0,'',0,0,'',0,0,0,0,'','','',''),(21,'tip',-21,1,0,0,21,0,0,1,1,'','','',3,0,'愿?━?',4,'222.22.22.22',1423378542,0,908,'',0,0,'?ㅻ쭏?명룿 ?ъ슜??留ㅻ쾲 濡쒓렇???덊븯怨?諛붾줈 ?ㅽ뻾?섎뒗 諛⑸쾿???뚭컻?⑸땲??',0,'Prayer','bible','danylight@gmail.com','','2','','k3GH1.RB9eEYE',0,'danycho','?ㅻ쭏?명룿 ?ъ슜??留ㅻ쾲 濡쒓렇???덊븯怨?諛붾줈 ?ㅽ뻾?섎뒗 諛⑸쾿???뚭컻?⑸땲??\r\n\r\n<b>1. ?덈뱶濡쒖씠????湲곗?</b>\r\n\r\n釉뚮씪?곗??ㅽ뻾 --> 濡쒓렇??--> ?깃꼍?쎄린 ??泥ロ솕硫?--> 利먭꺼李얘린 異붽? --> ?덉뿉 諛붾줈媛?린 異붽?\r\n?댄썑 遺?꽣???덊솕硫댁뿉 異붽????깃꼍?쎄린 ?꾩씠肄섏쓣 ?대┃?섎㈃ ?몄쬆?놁씠 諛붾줈 ?ㅽ뻾?⑸땲??\r\n\r\n[釉뚮씪?곗? - 濡쒓렇?? bs.ubf.kr \r\n <img src=/bible/image/image002.jpg>\r\n\r\n[??泥ロ솕硫?\r\n <img src=/bible/image/image004.jpg>\r\n\r\n[?덊솕硫댁뿉??遺곷쭏??異붽?]\r\n諛섎뱶??濡쒓렇?????덊솕硫댁뿉??異붽??섏뀛?쇳빀?덈떎.\r\n媛ㅻ윮?쏶?쒕━利?- 醫뚯륫?섎떒 踰꾪듉?대┃,\r\nLG?듯떚癒몄뒪?쒕━利?- ?곗륫?섎떒 踰꾪듉 ?대┃\r\n  <img src=/bible/image/image006.jpg>\r\n\r\n[遺곷쭏???붾㈃?먯꽌 ?깃꼍?쎄린 ??ぉ??袁밸늻由?\r\n <img src=/bible/image/image008.jpg>\r\n \r\n[?덉뿉 諛붾줈媛?린 異붽?]\r\n <img src=/bible/image/image010.jpg>\r\n\r\n <img src=/bible/image/image012.jpg>\r\n\r\n?댄썑 遺?꽣???덊솕硫댁뿉 異붽????깃꼍?쎄린 ?꾩씠肄섏쓣 ?대┃?섎㈃ ?몄쬆?놁씠 諛붾줈 ?ㅽ뻾?⑸땲??\r\n\r\n<b>2. ?꾩씠??/b>\r\n\r\n?ы뙆由??밸툕?쇱슦??뿉??bs.ubf.kr ?꾩슦怨?濡쒓렇????\r\n(諛섎뱶??濡쒓렇?명썑 ?덊솕硫댁뿉???섏뀛?쇳븿)\r\n\r\n釉뚮씪?곗? ?섎떒???ㅻえ 諛뺤뒪???꾨??ν븯???붿궡?쒓? 寃뱀퀜吏??꾩씠肄??대┃\r\n<img src=/bible/image/iphone-1.png>\r\n\r\n?덊솕硫댁뿉 異붽? ?꾩씠肄??대┃\r\n<img src=/bible/image/iphone-2.png>\r\n\r\n?곗륫?곷떒??[異붽?] ?대┃\r\n<img src=/bible/image/iphone-3.png>\r\n\r\n?덊솕硫댁뿉 異붽???\r\n<img src=/bible/image/iphone-4.png>\r\n\r\n<b>3. ?꾩씠?⑤뱶</b>\r\n\r\n?꾩씠?곌낵 ?좎궗?섎굹 ?쀭솕?댄몴 諛뺤뒪媛?釉뚮씪?곗? ?곗륫?곷떒???덉쓬.\r\n<img src=/bible/image/ipad-1.png>\r\n\r\n?곗륫?곷떒??[異붽?] ?대┃\r\n<img src=/bible/image/ipad-2.png>\r\n\r\n?덊솕硫댁뿉 異붽???\r\n<img src=/bible/image/ipad-3.png>\r\n\r\n?댄썑 遺?꽣???덊솕硫댁뿉 異붽????깃꼍?쎄린 ?꾩씠肄섏쓣 ?대┃?섎㈃ ?몄쬆?놁씠 諛붾줈 ?ㅽ뻾?⑸땲??','','','',0,0,'',0,0,0,'',0,0,'',0,0,0,0,'','','',''),(22,'tip',-22,1,0,NULL,22,0,NULL,1,1,NULL,NULL,NULL,0,0,'愿?━?',3,'211.192.65.60',1446190170,NULL,242,NULL,NULL,NULL,'?덈뱶濡쒖씠???ㅻ쭏?명룿 ?????ㅼ튂踰꾩쟾?쇰줈 ?묒냽?섎뒗 諛⑸쾿 ?뚭컻',0,'愿?━?','bible','',NULL,NULL,NULL,'',0,NULL,'?덈뱶濡쒖씠???ㅻ쭏?명룿 ?????ㅼ튂踰꾩쟾?쇰줈 ?깃꼍?쎄린 ?쒕퉬???묒냽?섎뒗 諛⑸쾿???뚭컻?⑸땲??\r\n?밸툕?쇱슦??? ?꾨땲???ㅻ쭏?명룿???깆쑝濡??ㅼ튂?댁꽌 ?묒냽?????덉뒿?덈떎.\r\n\r\n?꾨옒 ?ㅼ슫濡쒕뱶 留곹겕瑜??대┃?섏떆怨?apk ?뚯씪 ?ㅼ슫濡쒕뱶 諛쏆쑝???ㅼ쓬???ㅼ튂?섏떆硫??⑸땲??\r\n\r\n[<a href=http://bs.ubf.kr/temp/UBF_BibleService.apk target=_top>?덈뱶濡쒖씠???깃꼍?쎄린?쒕퉬?????ㅼ슫濡쒕뱶</a>]\r\n\r\n?ㅼ튂?섏떎???ㅻ쭏?명룿 ?ㅼ젙?먯꽌 蹂댁븞-> 異쒖쿂瑜??뚯닔 ?녿뒗 ???듭뀡???덉슜?쇰줈 蹂?꼍?섏뀛???⑸땲??\r\n?꾩쭅 ?뚯뒪?몃쾭?꾩씠???뺤떇?쇰줈 Play?ㅽ넗?댁뿉 ?깅줉?섏? ?딆븯湲??뚮Ц?낅땲??\r\n\r\n?ㅼ튂?섏떊??泥섏쓬 濡쒓렇???????ㅼ쓬 ?ㅽ뻾?쒕??곕뒗 濡쒓렇???놁씠 諛붾줈 ?쒕퉬???댁슜 媛?뒫?⑸땲??\r\n?덈뱶濡쒖씠???꾩슜?대?濡??꾩씠?곗뿉?쒕뒗 ?묐룞?덊빀?덈떎.\r\n\r\n?꾩쭅 珥덇린 媛쒕컻?닿퀬, ?묒냽?섎뒗 遺?텇留??깆쑝濡?援ы쁽?섏뿬 ?먮윭媛??덉쓣 ???덉뒿?덈떎.\r\n李멸퀬?섏떆怨??ъ슜??臾몄젣 ?먮뒗 嫄댁쓽?ы빆???덉쑝?쒕㈃ [嫄댁쓽 諛?媛쒖꽑?붿껌 寃뚯떆?????섍껄???щ젮二쇱떆硫?媛먯궗?섍쿋?듬땲??\r\n',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'none',NULL,NULL),(23,'tip',-23,1,0,NULL,23,0,NULL,1,1,NULL,NULL,NULL,0,0,'愿?━?',3,'211.192.65.60',1446190369,NULL,278,NULL,NULL,NULL,'媛쒖씤 湲곕룄?섏꺽 湲곕뒫???뚭컻?⑸땲??',0,'愿?━?','bible','',NULL,NULL,NULL,'',0,NULL,'媛쒖씤 湲곕룄?쒕ぉ???깅줉?섍퀬 泥댄겕?좎닔?덈뒗 湲곕룄?섏꺽 湲곕뒫???뚭컻?⑸땲??\r\n媛꾨떒???ъ슜諛⑸쾿???ㅼ쓬怨?媛숈뒿?덈떎.\r\n\r\n湲곕룄??->媛쒖씤湲곕룄??硫붾돱瑜??꾨Ⅴ?쒕㈃ ?댁슜?좎닔 ?덉뒿?덈떎.\r\n<img src=/bible/image/ppray1.png>\r\n\r\n<img src=/bible/image/ppray2.png width=300>\r\n\r\n媛쒖씤湲곕룄?ㅼ쓣 ?대┃?섎㈃ ?꾨옒??컳??湲곕룄以??묐떟/?꾩껜 ??씠 ?섏샃?덈떎.\r\n?쒕ぉ ?곗륫??[?곌린]踰꾪듉 ?대┃?섎㈃ 湲곕룄瑜??낅젰?????덉뒿?덈떎.\r\n<img src=/bible/image/ppray3.png width=300>\r\n\r\n<img src=/bible/image/ppray4.png width=300>\r\n\r\n湲곕룄?좏삎??\r\n媛쒖씤/媛?”/吏곸옣/?숈뾽/?뷀쉶/?쇳꽣/UBF/?좉탳/湲고? ??珥?9媛?醫낅쪟濡?援щ텇??媛?뒫?⑸땲??\r\n?쒖꽌??1.蹂댄넻, 2.?곗꽑, 3.理쒖슦?? 4.湲닿툒?쇰줈 ?섏뼱?덉뒿?덈떎.\r\n湲곕룄?쒕ぉ 由ъ뒪?몄뿉 4 -> 3 -> 2 -> 1 ?쒖꽌濡??뺣젹?섏뼱 ?쒖떆?⑸땲??\r\n?낅젰????옣踰꾪듉???꾨Ⅴ硫??ㅼ쓬怨쇨컳??湲곕룄以???뿉 湲곕룄?쒕ぉ???쒖떆?⑸땲??\r\n<img src=/bible/image/ppray5.png width=300>\r\n\r\n1. ?좉탳 [蹂댄넻] (0)      15-08-21 [湲곕룄以?\r\n?쇰줈 ?쒖떆?섎뒗??以묎컙???덈뒗 (0) ??湲곕룄泥댄겕???뚯닔媛??쒖떆?⑸땲??\r\n\r\n媛곴컖??湲곕룄?댁슜???대┃?섎㈃ ?좏깮???섎뒗???섎떒??\n湲곕룄泥댄겕 | ?묐떟 | 醫낅즺 | ?섏젙 | ??젣 諛붽? ?앸쾿?⑸땲??\r\n<img src=/bible/image/ppray6.png width=300>\r\n\r\n湲곕룄泥댄겕 踰꾪듉???꾨Ⅴ硫??좏깮??湲곕룄?쒕ぉ?ㅼ뿉 ??빐 泥댄겕?レ옄(0)??1??利앷??⑸땲??\r\n<img src=/bible/image/ppray9.png width=300>\r\n\r\n湲곕룄?묐떟?대릺???붿씠??湲곕룄瑜??덊빐???섎뒗 湲곕룄?쒕ぉ??寃쎌슦 ?섎떒??[?묐떟]踰꾪듉???대┃?섎㈃ ?ㅼ쓬怨?媛숈씠 ?묐떟?댁슜??硫붾え?좎닔?덈뒗 李쎌씠 ?밸땲??\r\n<img src=/bible/image/ppray7.png width=300>\r\n\r\n??옣 踰꾪듉???꾨Ⅴ硫??꾨옒??컳???묐떟?댁슜??異붽??섍퀬 ?대떦 湲곕룄????빐 湲곕룄以???뿉???묐떟 ??쑝濡??대룞?⑸땲??\r\n洹몃━怨??묐떟?섏????딆븯?쇰굹 湲곕룄瑜?醫낅즺?섍퀬 ?띠쓣?뚮뒗 醫낅즺踰꾪듉???대┃?섎㈃ 醫낅즺?댁슜???낅젰??醫낅즺?쒗궗???덉뒿?덈떎.\r\n[?꾩껜] ??쓣 ?꾨Ⅴ硫??묐떟怨?醫낅즺?깆씠 ?ы븿??紐⑤뱺 湲곕룄?쒕ぉ?ㅼ쓣 蹂??섏엳?듬땲??\r\n<img src=/bible/image/ppray8.png width=300>\r\n\r\n媛쒖씤湲곕룄?ㅼ뿉 ?깅줉??湲곕룄?쒕ぉ???덉쓣寃쎌슦 ?깃꼍?쎄린?쒕퉬??泥ロ럹?댁? ?섎떒??泥ル쾲吏?湲곕룄?쒕ぉ???쒖떆?섍퀬 ?대떦 湲곕룄?쒕ぉ???대┃?섎㈃ 諛붾줈 媛쒖씤湲곕룄???쒕퉬?ㅻ줈 ?대룞??媛?뒫?⑸땲??\r\n<img src=/bible/image/ppray10.png width=300>\r\n\r\n媛쒖씤湲곕룄?ㅼ쓣 ?ъ슜?대낫?쒓퀬 ?섏젙?ы빆?대굹 媛쒖꽑?붿껌?ы빆???덉쑝硫?\r\n[嫄댁쓽 諛?媛쒖꽑?붿껌 寃뚯떆?????섍껄???щ젮二쇱떆硫?媛먯궗?섍쿋?듬땲??\r\n\r\n蹂?媛쒖씤湲곕룄?ㅼ씠 媛쒖씤 湲곕룄 ?쒖꽦?붿뿉 ?꾩????????덇린瑜?湲곕룄?⑸땲??',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'none',NULL,NULL),(24,'tip',-24,1,0,NULL,24,0,NULL,1,1,NULL,NULL,NULL,0,0,'Joseph2',0,'0.0.0.0',1539379541,NULL,1,NULL,NULL,NULL,'개인 기도실 소개합니다.',0,'Wonhee Cho2','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'개인 기도실 소개합니다.',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'LA',NULL,NULL);
/*!40000 ALTER TABLE `a_tn2_tip_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:06:27

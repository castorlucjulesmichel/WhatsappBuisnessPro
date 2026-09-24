(() => {
"use strict";

const LANGS=["ht","fr","en","es","pt","de","it","ar","zh","hi","bn","ru","tr","ja","ko"];
const saved=()=>{const v=localStorage.getItem("wbp_lang");return LANGS.includes(v)?v:"ht"};

/*
  Central UI dictionary.
  Each entry: [Haitian Creole, French, English, Spanish, ...known source variants]
  The engine reverse-maps any existing source variant to one canonical key, so the
  current mixed-language HTML can be translated without duplicating UI markup.
*/
const D={
"welcome":["Byenvini","Bienvenue","Welcome","Bienvenido"],
"logout":["Soti","Déconnexion","Log out","Cerrar sesión"],
"search":["Chèche...","Rechercher...","Search...","Buscar..."],
"receive_notifications":["Resevwa notifikasyon","Recevoir des notifications","Receive notifications","Recibir notificaciones"],
"notification_hint":["Asire w ou pa rate okenn nouvo mesaj.","Assurez-vous de ne manquer aucun nouveau message.","Make sure you don't miss any new message.","Asegúrate de no perder ningún mensaje nuevo."],
"activate":["Aktive","Activer","Enable","Activar"],
"all":["Tout","Toutes","All","Todas"],
"unread":["Pa li","Non lues","Unread","No leídos"],
"favorites":["Favori","Favoris","Favorites","Favoritos"],
"groups":["Gwoup","Groupes","Groups","Grupos"],
"discussions":["Diskisyon","Discussions","Chats","Chats"],
"calls":["Apèl","Appels","Calls","Llamadas"],
"news":["Aktyalite","Actus","Updates","Novedades"],
"tools":["Zouti","Outils","Tools","Herramientas"],
"wallet":["Pòtfèy","Portefeuille","Wallet","Billetera"],
"start":["Kòmanse","Commencer","Start","Comenzar"],
"new_group":["Nouvo gwoup","Nouveau groupe","New group","Nuevo grupo"],
"create_group":["Kreye gwoup","Créer le groupe","Create group","Crear grupo"],
"choose_chat":["Chwazi yon chat","Choisissez une discussion","Choose a chat","Elige un chat"],
"typing":["Ap ekri...","Écrit...","Typing...","Escribiendo..."],
"send":["Voye","Envoyer","Send","Enviar"],
"support_admin":["🔐 Chat sipò / Admin","🔐 Chat assistance / Admin","🔐 Support / Admin chat","🔐 Chat soporte / Admin"],
"create_call_link":["Kreye yon lyen apèl","Créer un lien d’appel","Create a call link","Crear un enlace de llamada"],
"call_link_hint":["Pataje yon lyen pou yon apèl odyo oswa videyo nan Whatsapp Business Pro.","Partagez un lien pour un appel audio ou vidéo dans Whatsapp Business Pro.","Share a link for an audio or video call in Whatsapp Business Pro.","Comparte un enlace para una llamada de audio o video en Whatsapp Business Pro."],
"recent":["Resan","Récents","Recent","Recientes"],
"no_recent_calls":["Pa gen apèl resan.","Aucun appel récent.","No recent calls.","No hay llamadas recientes."],
"select_contact":["Chwazi yon kontak","Sélectionner un contact","Select a contact","Seleccionar un contacto"],
"new_contact":["Nouvo kontak","Nouveau contact","New contact","Nuevo contacto"],
"contacts_on_app":["Kontak sou Whatsapp Business Pro","Contacts sur Whatsapp Business Pro","Contacts on Whatsapp Business Pro","Contactos en Whatsapp Business Pro"],
"no_contacts":["Pa gen kontak pou kounye a.","Aucun contact pour le moment.","No contacts yet.","Aún no hay contactos."],
"first_name":["Prenon","Prénom","First name","Nombre"],
"last_name":["Siyati","Nom","Last name","Apellido"],
"profile_name":["Non pwofil / username","Nom de profil / username","Profile name / username","Nombre de perfil / usuario"],
"phone":["Telefòn","Téléphone","Phone","Teléfono"],
"sync_phone":["Senkronize kontak la sou telefòn","Synchroniser le contact sur le téléphone","Sync contact to phone","Sincronizar contacto con el teléfono"],
"sync_phone_hint":["Sou Web/PWA, paramèt sa a anrejistre kòm preferans sèlman.","Sur le Web/PWA, ce réglage est enregistré comme préférence uniquement.","On Web/PWA, this setting is saved as a preference only.","En Web/PWA, esta opción solo se guarda como preferencia."],
"save":["Anrejistre","Enregistrer","Save","Guardar"],
"status":["Estati","Statut","Status","Estado"],
"status_desc":["Estati, videyo kout ak kontni patwone","Status, vidéos courtes et contenus sponsorisés","Status, short videos and sponsored content","Estados, videos cortos y contenido patrocinado"],
"sponsored_statuses":["Estati patwone","Statuts sponsorisés","Sponsored statuses","Estados patrocinados"],
"clips":["Klip","Clips","Clips","Clips"],
"develop_audience":["Devlope odyans ou","Développer votre audience","Grow your audience","Desarrolla tu audiencia"],
"boost_content":["Bouste yon kontni","Booster un contenu","Boost content","Promocionar contenido"],
"market":["Mache","Marché","Market","Mercado"],
"buy":["Achte","Achat","Buy","Comprar"],
"sell":["Vann","Vente","Sell","Vender"],
"orders_sales":["Kòmand ak vant","Commandes et ventes","Orders and sales","Pedidos y ventas"],
"advertising":["Piblisite","Publicité","Advertising","Publicidad"],
"statistics":["Estatistik","Statistiques","Statistics","Estadísticas"],
"customer_activity":["Aktivite kliyan ou","Activité de votre clientèle","Customer activity","Actividad de clientes"],
"manage_account":["Jere kont ou","Gérez votre compte","Manage your account","Gestiona tu cuenta"],
"business_profile":["Pwofil Business","Profil Business","Business Profile","Perfil Business"],
"facebook_instagram":["Facebook ak Instagram","Facebook et Instagram","Facebook and Instagram","Facebook e Instagram"],
"account_profile":["Kont ak pwofil","Compte et profil","Account and profile","Cuenta y perfil"],
"settings":["Paramèt","Paramètres","Settings","Ajustes"],
"help_feedback":["Èd ak kòmantè","Aide et commentaires","Help and feedback","Ayuda y comentarios"],
"normal_status_hint":["Estati nòmal: kontak sèlman • Status Boost: odyans piblisite","Status normal : contacts uniquement • Status Boost : audience publicitaire","Normal status: contacts only • Status Boost: ad audience","Estado normal: solo contactos • Status Boost: audiencia publicitaria"],
"publish_24h":["Pibliye pou 24 èdtan","Publier pendant 24 heures","Publish for 24 hours","Publicar durante 24 horas"],
"my_contacts":["Kontak mwen","Mes contacts","My contacts","Mis contactos"],
"add":["Ajoute","Ajouter","Add","Agregar"],
"my_contact_status":["Estati kontak mwen","Statuts de mes contacts","My contacts' status","Estados de mis contactos"],
"sponsored_status":["Estati patwone","Statut sponsorisé","Sponsored Status","Estado patrocinado"],
"marketplace":["Marketplace","Marketplace","Marketplace","Marketplace"],
"buy_sell_products":["Achte ak vann pwodwi","Achat et vente de produits","Buy and sell products","Compra y venta de productos"],
"cart":["Panye","Panier","Cart","Carrito"],
"publish":["Pibliye","Publier","Publish","Publicar"],
"create_order":["Kreye kòmand","Créer la commande","Create order","Crear pedido"],
"all_categories":["Tout kategori","Toutes les catégories","All categories","Todas las categorías"],
"short_video_space":["Espas videyo kout","Espace de vidéos courtes","Short video space","Espacio de videos cortos"],
"publish_clip":["Pibliye klip","Publier le clip","Publish clip","Publicar clip"],
"balances_finance":["Balans, depo, retrè, echanj ak envestisman","Soldes, dépôts, retraits, échanges et investissements","Balances, deposits, withdrawals, exchanges and investments","Saldos, depósitos, retiros, cambios e inversiones"],
"investments":["Envestisman","Investissements","Investments","Inversiones"],
"new_operation":["Nouvo operasyon","Nouvelle opération","New operation","Nueva operación"],
"deposit":["Depo","Dépôt","Deposit","Depósito"],
"withdrawal":["Retrè","Retrait","Withdrawal","Retiro"],
"transfer":["Transfè","Transfert","Transfer","Transferencia"],
"proof_optional":["Prèv (opsyonèl)","Preuve (facultative)","Proof (optional)","Comprobante (opcional)"],
"submit":["Soumèt","Soumettre","Submit","Enviar"],
"currency_exchange":["Echanj deviz","Échange de devises","Currency exchange","Cambio de divisas"],
"send_exchange":["Voye demann echanj","Envoyer la demande d’échange","Send exchange request","Enviar solicitud de cambio"],
"operation_history":["Istorik operasyon","Historique des opérations","Operation history","Historial de operaciones"],
"orders_sales_title":["Kòmand & Vant","Commandes & Ventes","Orders & Sales","Pedidos y Ventas"],
"buyer_orders":["Kòmand mwen kòm achtè","Mes commandes comme acheteur","My buyer orders","Mis pedidos como comprador"],
"seller_sales":["Vant mwen kòm vandè","Mes ventes comme vendeur","My seller sales","Mis ventas como vendedor"],
"revenue":["Revni","Revenus","Revenue","Ingresos"],
"sales_currency":["Vant pa deviz","Ventes par devise","Sales by currency","Ventas por moneda"],
"business_pro":["Business Pro","Business Pro","Business Pro","Business Pro"],
"business_tools":["Pwofil biznis ak zouti mesaj","Profil professionnel et outils de messagerie","Business profile and messaging tools","Perfil comercial y herramientas de mensajería"],
"business_profile_small":["Pwofil biznis","Profil professionnel","Business profile","Perfil comercial"],
"save_tools":["Sove zouti","Enregistrer les outils","Save tools","Guardar herramientas"],
"boost_ads":["Boost & Ads","Boost & Ads","Boost & Ads","Boost & Ads"],
"deposit_boost":["+ Depoze pou Boost","+ Déposer pour Boost","+ Deposit for Boost","+ Depositar para Boost"],
"payment_proof":["Prèv peman","Preuve de paiement","Payment proof","Comprobante de pago"],
"send_deposit_request":["Voye demann depo","Envoyer la demande de dépôt","Send deposit request","Enviar solicitud de depósito"],
"what_boost":["Sa w ap bouste","Ce que vous boostez","What you're boosting","Qué promocionas"],
"goal":["Objektif","Objectif","Goal","Objetivo"],
"more_messages":["Plis mesaj","Plus de messages","More messages","Más mensajes"],
"more_sales":["Plis vant","Plus de ventes","More sales","Más ventas"],
"more_reach":["Plis moun wè li","Plus de portée","More reach","Más alcance"],
"more_profile":["Plis vizit profil","Plus de visites du profil","More profile visits","Más visitas al perfil"],
"audience":["Odyans","Audience","Audience","Audiencia"],
"automatic":["Otomatik","Automatique","Automatic","Automático"],
"custom":["Pèsonalize","Personnalisé","Custom","Personalizado"],
"create_boost":["Kreye Boost","Créer le Boost","Create Boost","Crear Boost"],
"my_profile":["Pwofil mwen","Mon profil","My profile","Mi perfil"],
"linked_devices":["Aparèy konekte","Appareils connectés","Linked devices","Dispositivos vinculados"],
"account":["Kont","Compte","Account","Cuenta"],
"privacy":["Konfidansyalite","Confidentialité","Privacy","Privacidad"],
"lists":["Lis","Listes","Lists","Listas"],
"notifications":["Notifikasyon","Notifications","Notifications","Notificaciones"],
"storage_data":["Depo ak done","Stockage et données","Storage and data","Almacenamiento y datos"],
"accessibility":["Aksè","Accessibilité","Accessibility","Accesibilidad"],
"app_language":["Lang aplikasyon an","Langue de l’application","App language","Idioma de la aplicación"],
"invite_contact":["Envite yon kontak","Inviter un contact","Invite a contact","Invitar a un contacto"],
"connection_security":["Koneksyon ak sekirite","Connexion et sécurité","Connection and security","Conexión y seguridad"],
"passkeys":["Kle aksè","Clés d’accès","Passkeys","Claves de acceso"],
"password":["Modpas","Mot de passe","Password","Contraseña"],
"email":["Adrès imèl","Adresse e-mail","Email address","Correo electrónico"],
"two_step":["Verifikasyon an 2 etap","Vérification en deux étapes","Two-step verification","Verificación en dos pasos"],
"security_notifications":["Notifikasyon sekirite","Notifications de sécurité","Security notifications","Notificaciones de seguridad"],
"your_account":["Kont ou","Votre compte","Your account","Tu cuenta"],
"change_phone":["Chanje nimewo telefòn","Changer de numéro de téléphone","Change phone number","Cambiar número de teléfono"],
"request_account_info":["Mande enfòmasyon kont la","Demander les infos du compte","Request account info","Solicitar información de la cuenta"],
"delete_account":["Efase kont la","Supprimer le compte","Delete account","Eliminar cuenta"],
"who_can_see":["Kiyès ki ka wè enfòmasyon pèsonèl mwen","Qui peut voir mes infos personnelles","Who can see my personal info","Quién puede ver mi información personal"],
"online_presence":["Prezans anliy","Présence en ligne","Online presence","Presencia en línea"],
"my_contacts_opt":["Kontak mwen","Mes contacts","My contacts","Mis contactos"],
"everyone":["Tout moun","Tout le monde","Everyone","Todos"],
"nobody":["Pèsonn","Personne","Nobody","Nadie"],
"profile_photo":["Foto pwofil","Photo de profil","Profile photo","Foto de perfil"],
"about":["Enfòmasyon","Infos","About","Info"],
"selected_contacts":["Kontak chwazi","Contacts sélectionnés","Selected contacts","Contactos seleccionados"],
"read_receipts":["Konfimasyon lekti","Confirmations de lecture","Read receipts","Confirmaciones de lectura"],
"disappearing_messages":["Mesaj efemè","Messages éphémères","Disappearing messages","Mensajes temporales"],
"disappear_after":["Tan anvan disparisyon","Délai avant disparition","Default message timer","Duración predeterminada"],
"off":["Dezaktive","Désactivé","Off","Desactivado"],
"24_hours":["24 èdtan","24 heures","24 hours","24 horas"],
"7_days":["7 jou","7 jours","7 days","7 días"],
"90_days":["90 jou","90 jours","90 days","90 días"],
"focus_people":["Konsantre sou moun ki pi enpòtan pou ou.","Concentrez-vous sur les personnes qui comptent le plus.","Focus on the people who matter most.","Concéntrate en las personas que más importan."],
"share_simple":["Voye epi pataje fasil.","Envoyez et partagez en toute simplicité.","Send and share with ease.","Envía y comparte fácilmente."],
"create":["＋ Kreye","＋ Créer","＋ Create","＋ Crear"],
"automation":["Otomatizasyon","Automatisation","Automation","Automatización"],
"auto_lists":["Lis kreye otomatikman","Listes créées automatiquement","Automatically created lists","Listas creadas automáticamente"],
"your_lists":["Lis ou yo","Vos listes","Your lists","Tus listas"],
"preset_list":["Lis predefini","Liste prédéfinie","Preset list","Lista predefinida"],
"display":["Afichaj","Affichage","Display","Pantalla"],
"theme":["Tèm","Thème","Theme","Tema"],
"system":["Sistèm","Système","System","Sistema"],
"light":["Klè","Clair","Light","Claro"],
"dark":["Fènwa","Sombre","Dark","Oscuro"],
"default_chat_theme":["Tèm diskisyon pa defo","Thème de discussion par défaut","Default chat theme","Tema de chat predeterminado"],
"chat_settings":["Paramèt diskisyon","Paramètres des discussions","Chat settings","Ajustes de chat"],
"enter_to_send":["Antre pou voye","Entrée pour envoyer","Enter to send","Enter para enviar"],
"media_visibility":["Vizibilite medya","Visibilité des médias","Media visibility","Visibilidad de medios"],
"font_size":["Gwosè polis","Taille de la police","Font size","Tamaño de fuente"],
"small":["Piti","Petite","Small","Pequeña"],
"medium":["Mwayen","Moyenne","Medium","Mediana"],
"large":["Gwo","Grande","Large","Grande"],
"sticker_suggestions":["Sijesyon sticker","Suggestions de stickers","Sticker suggestions","Sugerencias de stickers"],
"archived_chats":["Diskisyon achive","Discussions archivées","Archived chats","Chats archivados"],
"keep_archived":["Kenbe diskisyon yo achive","Maintenir les discussions archivées","Keep chats archived","Mantener chats archivados"],
"message_sound":["Son mesaj","Son des messages","Message sounds","Sonidos de mensajes"],
"reminders":["Rapèl","Rappels","Reminders","Recordatorios"],
"messages":["Mesaj","Messages","Messages","Mensajes"],
"notification_sound":["Son notifikasyon","Son de notification","Notification sound","Sonido de notificación"],
"default_browser":["Pa defo navigatè a","Par défaut du navigateur","Browser default","Predeterminado del navegador"],
"vibrate":["Vibrasyon","Vibreur","Vibrate","Vibración"],
"important_priority":["Notifikasyon priyorite enpòtan","Notifications de priorité importante","High priority notifications","Notificaciones de alta prioridad"],
"reaction_notifications":["Notifikasyon reyaksyon","Notifications des réactions","Reaction notifications","Notificaciones de reacciones"],
"ringtone":["Sonri","Sonnerie","Ringtone","Tono de llamada"],
"reactions":["Reyaksyon","Réactions","Reactions","Reacciones"],
"orders":["Kòmand","Commandes","Orders","Pedidos"],
"boost_ads_notifications":["Boost ak piblisite","Boost et publicités","Boost and ads","Boost y publicidad"],
"auto_download":["Telechajman otomatik","Téléchargement automatique","Media auto-download","Descarga automática"],
"wifi_only":["Wi-Fi sèlman","Wi-Fi uniquement","Wi-Fi only","Solo Wi-Fi"],
"wifi_mobile":["Wi-Fi ak done mobil","Wi-Fi et données mobiles","Wi-Fi and mobile data","Wi-Fi y datos móviles"],
"never":["Jamè","Jamais","Never","Nunca"],
"video_data_saver":["Ekonomize done videyo","Économiseur de données vidéo","Video data saver","Ahorro de datos de video"],
"share_customer_activity":["Pataje aktivite kliyan","Partager l’activité clientèle","Share customer activity","Compartir actividad de clientes"],
"high_contrast":["Kontras wo","Contraste élevé","High contrast","Alto contraste"],
"reduce_motion":["Redui animasyon","Réduire les animations","Reduce motion","Reducir animaciones"],
"language":["Lang","Langue","Language","Idioma"],
"contact_support":["Kontakte asistans","Contacter l’assistance","Contact support","Contactar soporte"],
"modify_profile":["Modifye pwofil","Modifier le profil","Edit profile","Editar perfil"],
"public_profile":["Pwofil ou piblik nan Whatsapp Business Pro.","Votre profil est public dans Whatsapp Business Pro.","Your profile is public in Whatsapp Business Pro.","Tu perfil es público en Whatsapp Business Pro."],
"business_info":["Enfòmasyon sou biznis","Informations sur l’entreprise","Business information","Información de la empresa"],
"buyer":["Achtè","Acheteur","Buyer","Comprador"],
"seller":["Vandè","Vendeur","Seller","Vendedor"],
"other_business":["Lòt antrepriz","Autre entreprise","Other business","Otra empresa"],
"investor":["Envestisè","Investisseur","Investor","Inversor"],
"products_services":["Pwodwi ak sèvis","Produits et services","Products and services","Productos y servicios"],
"catalog":["Katalòg","Catalogue","Catalog","Catálogo"],
"links":["Lyen","Liens","Links","Enlaces"],
"contact_details":["Kontak","Coordonnées","Contact details","Datos de contacto"],
"save_profile":["Anrejistre pwofil","Enregistrer le profil","Save profile","Guardar perfil"],
"location":["Lokalizasyon","Localisation","Location","Ubicación"],
"not_shared":["Pa pataje.","Non partagée.","Not shared.","No compartida."],
"share_location":["Pataje lokalizasyon aktyèl","Partager la localisation actuelle","Share current location","Compartir ubicación actual"],
"virtual_assistant":["Asistan vityèl","Assistant virtuel","Virtual assistant","Asistente virtual"],
"connected":["Konekte","Connecté","Connected","Conectado"],
"balance":["Balans","Solde","Balance","Saldo"],
"products":["Pwodwi","Produits","Products","Productos"],
"sales":["Vant","Ventes","Sales","Ventas"],
"close":["Fèmen","Fermer","Close","Cerrar"]
};

const extraAliases={
  "Kreyòl":"app_language_ht","Français":"app_language_fr","English":"app_language_en","Español":"app_language_es",
  "HT":"lang_ht","FR":"lang_fr","EN":"lang_en","ES":"lang_es",
  "Notifikasyon":"notifications","Statistik":"statistics","Status":"status","Sponsored Status":"sponsored_status"
};
D.app_language_ht=["Kreyòl","Créole haïtien","Haitian Creole","Criollo haitiano"];
D.app_language_fr=["Fransè","Français","French","Francés"];
D.app_language_en=["Anglè","Anglais","English","Inglés"];
D.app_language_es=["Panyòl","Espagnol","Spanish","Español"];
D.lang_ht=["HT","HT","HT","HT"];D.lang_fr=["FR","FR","FR","FR"];D.lang_en=["EN","EN","EN","EN"];D.lang_es=["ES","ES","ES","ES"];


Object.assign(D,{
"setup_not_configured":["Firebase poko konfigire pou nouvo app endepandan sa a.","Firebase n’est pas encore configuré pour cette application indépendante.","Firebase is not configured yet for this independent app.","Firebase aún no está configurado para esta aplicación independiente."],
"setup_create_project":["Kreye yon nouvo pwojè Firebase epi mete config li nan","Créez un nouveau projet Firebase et placez sa configuration dans","Create a new Firebase project and put its config in","Crea un nuevo proyecto Firebase y coloca su configuración en"],
"send_otp":["Voye kòd OTP","Envoyer le code OTP","Send OTP code","Enviar código OTP"],
"verify":["Verifye","Vérifier","Verify","Verificar"],
"app_summary":["Chat, biznis, marketplace, videyo, wallet ak envestisman nan yon sèl app.","Chat, business, marketplace, vidéos, portefeuille et investissements dans une seule application.","Chat, business, marketplace, videos, wallet and investments in one app.","Chat, negocios, marketplace, videos, billetera e inversiones en una sola aplicación."],
"camera":["Kamera","Caméra","Camera","Cámara"],
"menu":["Meni","Menu","Menu","Menú"],
"new_discussion":["Nouvo diskisyon","Nouvelle discussion","New chat","Nuevo chat"],
"username":["Username","Nom d’utilisateur","Username","Usuario"],
"group_name":["Non gwoup","Nom du groupe","Group name","Nombre del grupo"],
"group_members_hint":["Username manm yo, separe ak vigil. Egzanp: jean, marie, pierre","Noms d’utilisateur des membres, séparés par des virgules. Exemple : jean, marie, pierre","Member usernames, separated by commas. Example: jean, marie, pierre","Usuarios de los miembros, separados por comas. Ejemplo: jean, marie, pierre"],
"attach_file":["Ajoute fichye","Ajouter un fichier","Attach file","Adjuntar archivo"],
"write_message":["Ekri mesaj...","Écrire un message...","Write a message...","Escribir un mensaje..."],
"voice_message":["Mesaj vokal","Message vocal","Voice message","Mensaje de voz"],
"write_admin":["Ekri administrasyon...","Écrire à l’administration...","Write to administration...","Escribir a administración..."],
"search_contact":["Chèche yon kontak...","Rechercher un contact...","Search a contact...","Buscar un contacto..."],
"status_publish_desc":["Pibliye foto, videyo oswa tèks pandan 24 èdtan","Publiez des photos, vidéos ou textes pendant 24 heures","Post photos, videos or text for 24 hours","Publica fotos, videos o texto durante 24 horas"],
"boosted_status_desc":["Estati bouste selon odyans ou chwazi a","Statuts boostés selon l’audience sélectionnée","Boosted statuses based on the selected audience","Estados promocionados según la audiencia seleccionada"],
"clips_desc":["Gade epi pibliye videyo kout tankou sou TikTok","Regardez et publiez des vidéos courtes comme sur TikTok","Watch and post short videos like on TikTok","Mira y publica videos cortos como en TikTok"],
"boost_from_tools":["Bouste yon estati, klip oswa pwodwi depi nan Zouti","Boostez un statut, un clip ou un produit depuis Outils","Boost a status, clip or product from Tools","Promociona un estado, clip o producto desde Herramientas"],
"tools_desc":["Mache, piblisite ak jesyon pwofesyonèl","Marché, publicité et gestion professionnelle","Market, advertising and professional management","Mercado, publicidad y gestión profesional"],
"browse_products":["Gade pwodwi yo, ajoute nan panye epi pase kòmand","Parcourez les produits, ajoutez au panier et passez commande","Browse products, add to cart and place orders","Explora productos, agrega al carrito y realiza pedidos"],
"publish_manage_sales":["Pibliye pwodwi ou epi jere vant ou","Publiez vos produits et gérez vos ventes","Publish your products and manage sales","Publica tus productos y gestiona tus ventas"],
"track_orders_sales":["Swiv acha, kòmand ak vant ou","Suivez vos achats, commandes et ventes","Track your purchases, orders and sales","Sigue tus compras, pedidos y ventas"],
"sales_stats_desc":["Vant, kòmand, revni ak pèfòmans","Ventes, commandes, revenus et performances","Sales, orders, revenue and performance","Ventas, pedidos, ingresos y rendimiento"],
"customer_activity_desc":["Jere done yo itilize pou amelyore piblisite ou","Gérez les données utilisées pour améliorer vos publicités","Manage data used to improve your ads","Gestiona los datos usados para mejorar tus anuncios"],
"business_profile_desc":["Adrès, orè, sit entènèt ak repons rapid","Adresses, horaires, site Web et réponses rapides","Addresses, hours, website and quick replies","Direcciones, horarios, sitio web y respuestas rápidas"],
"social_desc":["Konekte kont ou pou touche plis kliyan","Associez vos comptes pour toucher une clientèle plus large","Connect your accounts to reach more customers","Conecta tus cuentas para llegar a más clientes"],
"account_profile_desc":["Foto, username ak enfòmasyon piblik","Photo, username et informations publiques","Photo, username and public information","Foto, usuario e información pública"],
"settings_desc":["Konfidansyalite, diskisyon, notifikasyon, done ak lang","Confidentialité, discussions, notifications, données et langue","Privacy, chats, notifications, data and language","Privacidad, chats, notificaciones, datos e idioma"],
"support_desc":["Kontakte asistans nan chat sekirize a","Contactez l’assistance depuis le chat sécurisé","Contact support from the secure chat","Contacta soporte desde el chat seguro"],
"write_status":["Ekri yon estati...","Écrire un statut...","Write a status...","Escribir un estado..."],
"add_contact_username":["Ajoute kontak ak username","Ajouter un contact avec son nom d’utilisateur","Add contact by username","Agregar contacto por usuario"],
"no_contacts_short":["Pa gen kontak ankò.","Aucun contact pour le moment.","No contacts yet.","Aún no hay contactos."],
"no_active_contact_status":["Pa gen Estati kontak aktif.","Aucun statut de contact actif.","No active contact status.","No hay estados activos de contactos."],
"no_sponsored_status":["Pa gen Sponsored Status pou odyans ou kounye a.","Aucun statut sponsorisé pour votre audience actuellement.","No sponsored status for your audience right now.","No hay estados patrocinados para tu audiencia ahora."],
"sponsored_desc":["Estati ki bouste epi ki koresponn ak odyans ou.","Statut boosté correspondant à votre audience.","Boosted status matching your audience.","Estado promocionado que coincide con tu audiencia."],
"product_name":["Non pwodwi","Nom du produit","Product name","Nombre del producto"],
"price":["Pri","Prix","Price","Precio"],
"description":["Deskripsyon","Description","Description","Descripción"],
"search_products":["Chèche pwodwi...","Rechercher des produits...","Search products...","Buscar productos..."],
"caption":["Caption","Légende","Caption","Leyenda"],
"amount":["Montan","Montant","Amount","Monto"],
"destination":["Nimewo / kont / destinasyon","Numéro / compte / destination","Number / account / destination","Número / cuenta / destino"],
"transaction_ref":["Referans tranzaksyon","Référence de transaction","Transaction reference","Referencia de transacción"],
"note":["Nòt","Note","Note","Nota"],
"business_name":["Non biznis","Nom de l’entreprise","Business name","Nombre del negocio"],
"hours":["Orè","Horaires","Hours","Horarios"],
"website":["Sit entènèt","Site Web","Website","Sitio web"],
"greeting":["Mesaj akey","Message d’accueil","Greeting message","Mensaje de bienvenida"],
"away_message":["Mesaj absans","Message d’absence","Away message","Mensaje de ausencia"],
"target_country":["Peyi / zòn sib","Pays / zone cible","Target country / area","País / zona objetivo"],
"min_age":["Laj min","Âge minimum","Minimum age","Edad mínima"],
"max_age":["Laj max","Âge maximum","Maximum age","Edad máxima"],
"daily_budget":["Bidjè pa jou","Budget quotidien","Daily budget","Presupuesto diario"],
"duration_days":["Dire (jou)","Durée (jours)","Duration (days)","Duración (días)"],
"search_settings":["Chèche nan paramèt...","Rechercher dans les paramètres...","Search settings...","Buscar en ajustes..."],
"custom_list_name":["Non lis pèsonalize","Nom de la liste personnalisée","Custom list name","Nombre de lista personalizada"],
"business_public_name":["Non biznis / non piblik","Nom de l’entreprise / nom public","Business / public name","Nombre de empresa / público"],
"add_hours":["Ajoute orè","Ajouter les horaires","Add hours","Agregar horarios"],
"country_address":["Peyi / adrès","Pays / adresse","Country / address","País / dirección"],
"birth_year":["Ane nesans","Année de naissance","Birth year","Año de nacimiento"],
"business_email":["Imèl pwofesyonèl","Adresse e-mail professionnelle","Business email","Correo profesional"],
"ask_question":["Poze yon kestyon...","Posez une question...","Ask a question...","Haz una pregunta..."],
"no_products":["Pa gen pwodwi.","Aucun produit.","No products.","No hay productos."],
"empty_cart":["Panye vid.","Panier vide.","Cart is empty.","El carrito está vacío."],
"product_published":["Pwodwi pibliye.","Produit publié.","Product published.","Producto publicado."],
"order_created":["Kòmand kreye.","Commande créée.","Order created.","Pedido creado."],
"clip_published":["Klip pibliye.","Clip publié.","Clip published.","Clip publicado."],
"no_clips":["Pa gen klip.","Aucun clip.","No clips.","No hay clips."],
"no_chats":["Pa gen diskisyon pou filtè sa a.","Aucune discussion pour ce filtre.","No chats for this filter.","No hay chats para este filtro."],
"no_operations":["Pa gen operasyon.","Aucune opération.","No operations.","No hay operaciones."],
"no_levels":["Pa gen nivo aktif.","Aucun niveau actif.","No active levels.","No hay niveles activos."],
"no_investments":["Pa gen envestisman.","Aucun investissement.","No investments.","No hay inversiones."],
"no_buyer_orders":["Pa gen kòmand kòm achtè.","Aucune commande comme acheteur.","No buyer orders.","No hay pedidos como comprador."],
"no_sales":["Pa gen vant ankò.","Aucune vente pour le moment.","No sales yet.","Aún no hay ventas."],
"no_completed_sales":["Pa gen vant fini.","Aucune vente terminée.","No completed sales.","No hay ventas completadas."],
"notification_singular":["Notifikasyon","Notification","Notification","Notificación"],
"no_notifications":["Pa gen notifikasyon.","Aucune notification.","No notifications.","No hay notificaciones."],
"connected_first":["Konekte dabò.","Connectez-vous d’abord.","Sign in first.","Inicia sesión primero."],
"verify_info":["Verifye enfòmasyon yo.","Vérifiez les informations.","Check the information.","Verifica la información."],
"contact_not_registered":["Kontak sa poko enskri nan aplikasyon an.","Ce contact n’est pas encore inscrit dans l’application.","This contact is not registered in the app yet.","Este contacto aún no está registrado en la aplicación."],
"enter_profile_name":["Antre non pwofil / username.","Entrez le nom de profil / username.","Enter profile name / username.","Introduce el nombre de perfil / usuario."],
"contact_saved":["Kontak anrejistre.","Contact enregistré.","Contact saved.","Contacto guardado."],
"contact_saved_local":["Kontak anrejistre lokalman; w ap ka kontakte li lè li rantre nan aplikasyon an.","Contact enregistré localement; il pourra être contacté lorsqu’il rejoindra l’application.","Contact saved locally; you can contact them when they join the app.","Contacto guardado localmente; podrás contactarlo cuando se una a la aplicación."],
"settings_saved":["Paramèt anrejistre.","Paramètre enregistré.","Setting saved.","Ajuste guardado."],
"list_created":["Lis kreye.","Liste créée.","List created.","Lista creada."],
"list_removed":["Lis retire.","Liste supprimée.","List removed.","Lista eliminada."],
"no_custom_lists":["Pa gen lis kliyan ankò.","Aucune liste client pour le moment.","No customer lists yet.","Aún no hay listas de clientes."]
});


Object.assign(D,{
"setup_create_project2":["Kreye yon nouvo Firebase project epi mete config li nan","Créez un nouveau projet Firebase et placez sa configuration dans","Create a new Firebase project and put its config in","Crea un nuevo proyecto Firebase y coloca su configuración en"],
"app_tagline":["Business • Chat • Marketplace • Clips • Finance","Business • Chat • Marketplace • Clips • Finance","Business • Chat • Marketplace • Clips • Finance","Negocios • Chat • Marketplace • Clips • Finanzas"],
"ads_budget_desc":["Bidjè HTG/USD, odyans, MonCash ak NatCash","Budget HTG/USD, audience, MonCash et NatCash","HTG/USD budget, audience, MonCash and NatCash","Presupuesto HTG/USD, audiencia, MonCash y NatCash"],
"assistance":["Asistans","Assistance","Support","Asistencia"],
"back_updates":["← Aktyalite","← Actus","← Updates","← Novedades"],
"status_normal_full":["Estati nòmal: kontak sèlman • Status Boost: odyans piblisite","Status normal : contacts uniquement • Status Boost : audience publicitaire","Normal status: contacts only • Status Boost: ad audience","Estado normal: solo contactos • Status Boost: audiencia publicitaria"],
"add_status":["+ Estati","+ Status","+ Status","+ Estado"],
"contact_statuses":["Estati kontak mwen","Statuts de mes contacts","My contacts' statuses","Estados de mis contactos"],
"sponsored_matching":["Estati ki bouste epi ki koresponn ak odyans ou.","Statut boosté correspondant à votre audience.","Boosted status matching your audience.","Estado promocionado que coincide con tu audiencia."],
"back_tools":["← Zouti","← Outils","← Tools","← Herramientas"],
"add_sell":["+ Vann","+ Vendre","+ Sell","+ Vender"],
"publish_plus":["+ Pibliye","+ Publier","+ Publish","+ Publicar"],
"wallet_full_desc":["Balans, depo, retrè, echanj ak envestisman","Balances, dépôts, retraits, échanges et investissements","Balances, deposits, withdrawals, exchanges and investments","Saldos, depósitos, retiros, cambios e inversiones"],
"investment_levels_desc":["Nivo, demann ak swivi plasman ou","Niveaux, demandes et suivi de vos placements","Levels, requests and investment tracking","Niveles, solicitudes y seguimiento de inversiones"],
"payout":["Peman","Paiement","Payout","Pago"],
"bank_transfer":["Transfè bankè","Virement bancaire","Bank Transfer","Transferencia bancaria"],
"orders_tracking_desc":["Swivi kòmand kòm achtè ak vandè","Suivi des commandes comme acheteur et vendeur","Track orders as buyer and seller","Seguimiento de pedidos como comprador y vendedor"],
"stats_summary":["Rezime aktivite biznis ou","Résumé de votre activité professionnelle","Summary of your business activity","Resumen de tu actividad comercial"],
"back_wallet":["← Pòtfèy","← Portefeuille","← Wallet","← Billetera"],
"levels_requests_followup":["Nivo, demann ak swivi","Niveaux, demandes et suivi","Levels, requests and tracking","Niveles, solicitudes y seguimiento"],
"my_investments":["Envestisman mwen","Mes investissements","My investments","Mis inversiones"],
"save_short":["Sove","Enregistrer","Save","Guardar"],
"message_tools":["Zouti mesaj","Outils de messagerie","Messaging tools","Herramientas de mensajería"],
"choose_boost_target":["Chwazi pwodwi, klip oswa estati...","Choisissez un produit, un clip ou un statut...","Choose a product, clip or status...","Elige un producto, clip o estado..."],
"linked_devices_desc":["Itilize Whatsapp Business Pro sou lòt aparèy","Utilisez Whatsapp Business Pro sur d’autres appareils","Use Whatsapp Business Pro on other devices","Usa Whatsapp Business Pro en otros dispositivos"],
"account_desc":["Sekirite, nimewo ak enfòmasyon kont","Sécurité, numéro et informations du compte","Security, number and account information","Seguridad, número e información de la cuenta"],
"privacy_desc":["Prezans, foto, estati, gwoup ak konfimasyon","Présence, photo, statut, groupes et confirmations","Presence, photo, status, groups and receipts","Presencia, foto, estado, grupos y confirmaciones"],
"lists_desc":["Pa li, favori, gwoup ak lis pèsonalize","Non lues, favoris, groupes et listes personnalisées","Unread, favorites, groups and custom lists","No leídos, favoritos, grupos y listas personalizadas"],
"chats_desc":["Tèm, medya, polis, sticker ak achiv","Thèmes, médias, police, stickers et archives","Themes, media, font, stickers and archives","Temas, medios, fuente, stickers y archivos"],
"notifications_desc":["Mesaj, apèl, estati ak reyaksyon","Messages, appels, statut et réactions","Messages, calls, status and reactions","Mensajes, llamadas, estados y reacciones"],
"storage_desc":["Rezo ak telechajman otomatik","Réseau et téléchargement automatique","Network and auto-download","Red y descarga automática"],
"customer_data_desc":["Done komèsyal yo itilize pou kanpay ou","Données commerciales utilisées pour vos campagnes","Business data used for your campaigns","Datos comerciales usados para tus campañas"],
"social_api_desc":["Koneksyon atravè API ofisyèl lè li aktive","Connexion via API officielle lorsqu’elle sera activée","Connection through the official API when enabled","Conexión mediante API oficial cuando esté habilitada"],
"accessibility_desc":["Kontras, tèks ak animasyon","Contraste, texte et animations","Contrast, text and animations","Contraste, texto y animaciones"],
"support_info":["Asistans ak enfòmasyon","Assistance et informations","Support and information","Soporte e información"],
"share_app_link":["Pataje lyen Whatsapp Business Pro","Partager le lien de Whatsapp Business Pro","Share the Whatsapp Business Pro link","Compartir el enlace de Whatsapp Business Pro"],
"current_browser":["Navigatè aktyèl","Navigateur actuel","Current browser","Navegador actual"],
"active_session":["Sesyon aktif","Session active","Active session","Sesión activa"],
"multi_device_note":["Jesyon plizyè aparèy nèt mande swivi sesyon sou sèvè. Paj sa montre sèlman sesyon Web aktyèl la.","La gestion multi-appareils complète nécessite un suivi de sessions côté serveur. Cette page affiche uniquement la session Web actuelle.","Full multi-device management requires server-side session tracking. This page shows only the current Web session.","La gestión completa de varios dispositivos requiere seguimiento de sesiones en el servidor. Esta página muestra solo la sesión web actual."],
"phone_auth_no_password":["Pa itilize ak koneksyon pa telefòn","Non utilisé avec la connexion par téléphone","Not used with phone sign-in","No se usa con inicio de sesión por teléfono"],
"security_pref_saved":["Preferans sekirite anrejistre","Préférence de sécurité enregistrée","Security preference saved","Preferencia de seguridad guardada"],
"security_changes":["Montre chanjman enpòtan nan kont","Afficher les changements importants du compte","Show important account changes","Mostrar cambios importantes de la cuenta"],
"profile_name_short":["Non pwofil","Nom de profil","Profile name","Nombre de perfil"],
"who_sees_presence":["Chwazi kiyès ki ka wè prezans ou","Choisir qui peut voir votre présence","Choose who can see your presence","Elige quién puede ver tu presencia"],
"read_receipts_desc":["Si w dezaktive sa, ou pap voye ni resevwa konfimasyon lekti nan chat endividyèl.","Désactivez pour ne plus envoyer ni recevoir les confirmations dans les chats individuels","Turn this off to stop sending or receiving read receipts in individual chats","Desactívalo para dejar de enviar o recibir confirmaciones de lectura en chats individuales"],
"new_chat_messages":["Nouvo mesaj nan nouvo diskisyon","Nouveaux messages des nouvelles discussions","New messages in new chats","Nuevos mensajes en chats nuevos"],
"auto_lists_desc":["Òganize diskisyon ou selon aktivite yo","Organisez vos discussions selon leur activité","Organize chats based on activity","Organiza los chats según su actividad"],
"add_people_groups":["Ajoute moun oswa gwoup","Ajoutez des personnes ou des groupes","Add people or groups","Agrega personas o grupos"],
"default_system_theme":["Tèm sistèm pa defo","Thème par défaut du système","System default theme","Tema predeterminado del sistema"],
"enter_send_desc":["Kle Antre a ap voye mesaj ou","La touche Entrée enverra votre message","Enter key will send your message","La tecla Enter enviará tu mensaje"],
"media_gallery_desc":["Montre medya telechaje yo nan galri a lè navigatè a pèmèt sa","Afficher les médias téléchargés dans la galerie lorsque le navigateur le permet","Show downloaded media in the gallery when the browser allows it","Mostrar medios descargados en la galería cuando el navegador lo permita"],
"sticker_desc":["Montre sijesyon sticker pandan w ap ekri","Afficher des suggestions pendant la rédaction","Show sticker suggestions while typing","Mostrar sugerencias de stickers al escribir"],
"archived_desc":["Diskisyon achive yo rete achive lè nouvo mesaj rive","Les discussions archivées restent archivées lors de nouveaux messages","Archived chats stay archived when new messages arrive","Los chats archivados permanecen archivados al llegar nuevos mensajes"],
"message_sound_pref":["Preferans son pou mesaj k ap antre ak soti","Préférence de son pour messages entrants et sortants","Sound preference for incoming and outgoing messages","Preferencia de sonido para mensajes entrantes y salientes"],
"reminders_desc":["Rapèl pou mesaj pa li ak estati pa wè","Rappels de messages non lus et statuts non vus","Reminders for unread messages and unseen statuses","Recordatorios de mensajes no leídos y estados no vistos"],
"default_label":["Pa defo","Par défaut","Default","Predeterminado"],
"priority_desc":["Montre notifikasyon lè navigatè a otorize sa","Afficher les notifications lorsque le navigateur l’autorise","Show notifications when the browser allows it","Mostrar notificaciones cuando el navegador lo permita"],
"reaction_desc":["Montre notifikasyon pou reyaksyon sou mesaj","Afficher les notifications pour les réactions aux messages","Show notifications for message reactions","Mostrar notificaciones para reacciones a mensajes"],
"status_reaction_desc":["Notifikasyon lè yon moun reyaji ak yon estati","Notifications lorsque quelqu’un réagit à un statut","Notifications when someone reacts to a status","Notificaciones cuando alguien reacciona a un estado"],
"orders_alerts":["Alèt acha ak vant","Alertes achat et vente","Purchase and sales alerts","Alertas de compras y ventas"],
"ads_alerts":["Alèt kanpay ak depo Ads","Alertes de campagne et dépôt Ads","Campaign and Ads deposit alerts","Alertas de campañas y depósitos de Ads"],
"video_data_desc":["Redui itilizasyon done pou klip","Réduire l’utilisation de données pour les clips","Reduce data usage for clips","Reducir uso de datos para clips"],
"customer_activity_usage":["Itilize entèraksyon Marketplace/Business pou amelyore kanpay ou","Utiliser les interactions Marketplace/Business pour améliorer vos campagnes","Use Marketplace/Business interactions to improve campaigns","Usar interacciones Marketplace/Business para mejorar campañas"],
"privacy_no_chats":["Paramèt sa pa bay aksè ak konvèsasyon prive.","Ce réglage ne donne pas accès aux conversations privées.","This setting does not give access to private conversations.","Este ajuste no da acceso a conversaciones privadas."],
"legal_note":["Règleman konfidansyalite ak kondisyon itilizasyon ap ajoute anvan piblikasyon piblik.","Politique de confidentialité et conditions d’utilisation seront ajoutées avant publication publique.","Privacy policy and terms of use will be added before public release.","La política de privacidad y los términos de uso se añadirán antes del lanzamiento público."],
"firebase_number":["Nimewo Firebase","Numéro Firebase","Firebase number","Número Firebase"],
"sms_code":["Kòd SMS","Code SMS","SMS code","Código SMS"],
"stock":["Stock","Stock","Stock","Stock"],
"quick_reply_example":["/pri = Men pri yo...","/prix = Voici les prix...","/price = Here are the prices...","/precio = Aquí están los precios..."],
"electronics":["Elektwonik","Électronique","Electronics","Electrónica"],
"fashion":["Mòd","Mode","Fashion","Moda"],
"cosmetics":["Kosmetik","Cosmétiques","Cosmetics","Cosméticos"],
"food":["Manje","Alimentation","Food","Alimentos"],
"services_cat":["Sèvis","Services","Services","Servicios"],
"other_cat":["Lòt","Autre","Other","Otro"]
});


const EXTRA_LANGS=["pt","de","it","ar","zh","hi","bn","ru","tr","ja","ko"];
const X={
"welcome":["Bem-vindo","Willkommen","Benvenuto","مرحبًا","欢迎","स्वागत है","স্বাগতম","Добро пожаловать","Hoş geldiniz","ようこそ","환영합니다"],
"logout":["Sair","Abmelden","Esci","تسجيل الخروج","退出","लॉग आउट","লগ আউট","Выйти","Çıkış","ログアウト","로그아웃"],
"search":["Pesquisar...","Suchen...","Cerca...","بحث...","搜索...","खोजें...","খুঁজুন...","Поиск...","Ara...","検索...","검색..."],
"receive_notifications":["Receber notificações","Benachrichtigungen erhalten","Ricevi notifiche","تلقي الإشعارات","接收通知","सूचनाएँ प्राप्त करें","নোটিফিকেশন পান","Получать уведомления","Bildirimleri al","通知を受け取る","알림 받기"],
"notification_hint":["Não perca nenhuma nova mensagem.","Verpassen Sie keine neue Nachricht.","Non perdere nessun nuovo messaggio.","تأكد من عدم تفويت أي رسالة جديدة.","确保不错过任何新消息。","कोई नया संदेश न छूटे।","কোনো নতুন বার্তা মিস করবেন না।","Не пропускайте новые сообщения.","Yeni mesajları kaçırmayın.","新しいメッセージを見逃さないでください。","새 메시지를 놓치지 마세요."],
"activate":["Ativar","Aktivieren","Attiva","تفعيل","启用","सक्रिय करें","সক্রিয় করুন","Включить","Etkinleştir","有効にする","활성화"],
"all":["Todas","Alle","Tutte","الكل","全部","सभी","সব","Все","Tümü","すべて","전체"],
"unread":["Não lidas","Ungelesen","Non lette","غير مقروءة","未读","अपठित","অপঠিত","Непрочитанные","Okunmamış","未読","읽지 않음"],
"favorites":["Favoritos","Favoriten","Preferiti","المفضلة","收藏","पसंदीदा","পছন্দের","Избранное","Favoriler","お気に入り","즐겨찾기"],
"groups":["Grupos","Gruppen","Gruppi","المجموعات","群组","समूह","গ্রুপ","Группы","Gruplar","グループ","그룹"],
"discussions":["Conversas","Chats","Chat","الدردشات","聊天","चैट","চ্যাট","Чаты","Sohbetler","チャット","채팅"],
"calls":["Chamadas","Anrufe","Chiamate","المكالمات","通话","कॉल","কল","Звонки","Aramalar","通話","통화"],
"news":["Atualizações","Aktuelles","Aggiornamenti","التحديثات","动态","अपडेट","আপডেট","Обновления","Güncellemeler","更新","업데이트"],
"tools":["Ferramentas","Tools","Strumenti","الأدوات","工具","टूल्स","টুলস","Инструменты","Araçlar","ツール","도구"],
"wallet":["Carteira","Wallet","Portafoglio","المحفظة","钱包","वॉलेट","ওয়ালেট","Кошелёк","Cüzdan","ウォレット","지갑"],
"new_group":["Novo grupo","Neue Gruppe","Nuovo gruppo","مجموعة جديدة","新建群组","नया समूह","নতুন গ্রুপ","Новая группа","Yeni grup","新しいグループ","새 그룹"],
"create_group":["Criar grupo","Gruppe erstellen","Crea gruppo","إنشاء مجموعة","创建群组","समूह बनाएँ","গ্রুপ তৈরি করুন","Создать группу","Grup oluştur","グループを作成","그룹 만들기"],
"choose_chat":["Escolha uma conversa","Chat auswählen","Scegli una chat","اختر دردشة","选择聊天","चैट चुनें","চ্যাট নির্বাচন করুন","Выберите чат","Sohbet seçin","チャットを選択","채팅 선택"],
"typing":["Digitando...","Schreibt...","Sta scrivendo...","يكتب...","正在输入...","टाइप कर रहा है...","টাইপ করছে...","Печатает...","Yazıyor...","入力中...","입력 중..."],
"send":["Enviar","Senden","Invia","إرسال","发送","भेजें","পাঠান","Отправить","Gönder","送信","보내기"],
"support_admin":["🔐 Suporte / Admin","🔐 Support / Admin","🔐 Supporto / Admin","🔐 الدعم / الإدارة","🔐 支持 / 管理员","🔐 सहायता / एडमिन","🔐 সহায়তা / অ্যাডমিন","🔐 Поддержка / Админ","🔐 Destek / Yönetici","🔐 サポート / 管理者","🔐 지원 / 관리자"],
"select_contact":["Selecionar contato","Kontakt auswählen","Seleziona contatto","اختر جهة اتصال","选择联系人","संपर्क चुनें","কন্ট্যাক্ট নির্বাচন করুন","Выбрать контакт","Kişi seç","連絡先を選択","연락처 선택"],
"new_contact":["Novo contato","Neuer Kontakt","Nuovo contatto","جهة اتصال جديدة","新建联系人","नया संपर्क","নতুন কন্ট্যাক্ট","Новый контакт","Yeni kişi","新しい連絡先","새 연락처"],
"contacts_on_app":["Contatos no Whatsapp Business Pro","Kontakte auf Whatsapp Business Pro","Contatti su Whatsapp Business Pro","جهات الاتصال على Whatsapp Business Pro","Whatsapp Business Pro 上的联系人","Whatsapp Business Pro पर संपर्क","Whatsapp Business Pro-তে কন্ট্যাক্ট","Контакты в Whatsapp Business Pro","Whatsapp Business Pro kişileri","Whatsapp Business Pro の連絡先","Whatsapp Business Pro 연락처"],
"no_contacts":["Ainda não há contatos.","Noch keine Kontakte.","Nessun contatto.","لا توجد جهات اتصال بعد.","暂无联系人。","अभी कोई संपर्क नहीं।","এখনও কোনো কন্ট্যাক্ট নেই।","Контактов пока нет.","Henüz kişi yok.","連絡先はまだありません。","아직 연락처가 없습니다."],
"first_name":["Nome","Vorname","Nome","الاسم الأول","名字","पहला नाम","নাম","Имя","Ad","名","이름"],
"last_name":["Sobrenome","Nachname","Cognome","اسم العائلة","姓氏","उपनाम","পদবি","Фамилия","Soyad","姓","성"],
"profile_name":["Nome do perfil / usuário","Profilname / Benutzername","Nome profilo / username","اسم الملف / اسم المستخدم","个人资料名 / 用户名","प्रोफ़ाइल नाम / यूज़रनेम","প্রোফাইল নাম / ইউজারনেম","Имя профиля / username","Profil adı / kullanıcı adı","プロフィール名 / ユーザー名","프로필 이름 / 사용자명"],
"phone":["Telefone","Telefon","Telefono","الهاتف","电话","फ़ोन","ফোন","Телефон","Telefon","電話","전화"],
"sync_phone":["Sincronizar contato com o telefone","Kontakt mit Telefon synchronisieren","Sincronizza contatto sul telefono","مزامنة جهة الاتصال مع الهاتف","同步联系人到手机","संपर्क को फ़ोन से सिंक करें","ফোনে কন্ট্যাক্ট সিঙ্ক করুন","Синхронизировать с телефоном","Kişiyi telefonla eşitle","連絡先を電話と同期","연락처를 휴대폰과 동기화"],
"save":["Salvar","Speichern","Salva","حفظ","保存","सहेजें","সংরক্ষণ","Сохранить","Kaydet","保存","저장"],
"status":["Status","Status","Stato","الحالة","状态","स्टेटस","স্ট্যাটাস","Статус","Durum","ステータス","상태"],
"clips":["Clipes","Clips","Clip","المقاطع","短视频","क्लिप","ক্লিপ","Клипы","Klipler","クリップ","클립"],
"develop_audience":["Amplie seu público","Zielgruppe erweitern","Fai crescere il pubblico","وسّع جمهورك","扩大受众","अपना ऑडियंस बढ़ाएँ","অডিয়েন্স বাড়ান","Расширяйте аудиторию","Kitleni büyüt","オーディエンスを拡大","대상 확장"],
"boost_content":["Promover conteúdo","Inhalt bewerben","Promuovi contenuto","روّج للمحتوى","推广内容","कंटेंट प्रमोट करें","কনটেন্ট বুস্ট করুন","Продвигать контент","İçeriği öne çıkar","コンテンツを宣伝","콘텐츠 홍보"],
"market":["Mercado","Markt","Mercato","السوق","市场","मार्केट","মার্কেট","Рынок","Pazar","マーケット","마켓"],
"buy":["Comprar","Kaufen","Acquista","شراء","购买","खरीदें","কিনুন","Купить","Satın al","購入","구매"],
"sell":["Vender","Verkaufen","Vendi","بيع","出售","बेचें","বিক্রি","Продать","Sat","販売","판매"],
"orders_sales":["Pedidos e vendas","Bestellungen und Verkäufe","Ordini e vendite","الطلبات والمبيعات","订单与销售","ऑर्डर और बिक्री","অর্ডার ও বিক্রয়","Заказы и продажи","Siparişler ve satışlar","注文と販売","주문 및 판매"],
"advertising":["Publicidade","Werbung","Pubblicità","الإعلانات","广告","विज्ञापन","বিজ্ঞাপন","Реклама","Reklam","広告","광고"],
"statistics":["Estatísticas","Statistiken","Statistiche","الإحصاءات","统计","आँकड़े","পরিসংখ্যান","Статистика","İstatistikler","統計","통계"],
"customer_activity":["Atividade dos clientes","Kundenaktivität","Attività clienti","نشاط العملاء","客户活动","ग्राहक गतिविधि","কাস্টমার কার্যকলাপ","Активность клиентов","Müşteri etkinliği","顧客アクティビティ","고객 활동"],
"business_profile":["Perfil Business","Business-Profil","Profilo Business","الملف التجاري","商业资料","बिज़नेस प्रोफ़ाइल","বিজনেস প্রোফাইল","Бизнес-профиль","İşletme profili","ビジネスプロフィール","비즈니스 프로필"],
"account_profile":["Conta e perfil","Konto und Profil","Account e profilo","الحساب والملف","账户和资料","खाता और प्रोफ़ाइल","অ্যাকাউন্ট ও প্রোফাইল","Аккаунт и профиль","Hesap ve profil","アカウントとプロフィール","계정 및 프로필"],
"settings":["Configurações","Einstellungen","Impostazioni","الإعدادات","设置","सेटिंग्स","সেটিংস","Настройки","Ayarlar","設定","설정"],
"help_feedback":["Ajuda e comentários","Hilfe und Feedback","Aiuto e feedback","المساعدة والملاحظات","帮助与反馈","सहायता और फ़ीडबैक","সহায়তা ও মতামত","Помощь и отзывы","Yardım ve geri bildirim","ヘルプとフィードバック","도움말 및 피드백"],
"publish":["Publicar","Veröffentlichen","Pubblica","نشر","发布","प्रकाशित करें","প্রকাশ করুন","Опубликовать","Yayınla","公開","게시"],
"cart":["Carrinho","Warenkorb","Carrello","السلة","购物车","कार्ट","কার্ট","Корзина","Sepet","カート","장바구니"],
"investments":["Investimentos","Investitionen","Investimenti","الاستثمارات","投资","निवेश","বিনিয়োগ","Инвестиции","Yatırımlar","投資","투자"],
"deposit":["Depósito","Einzahlung","Deposito","إيداع","充值","जमा","ডিপোজিট","Пополнение","Yatırma","入金","입금"],
"withdrawal":["Saque","Auszahlung","Prelievo","سحب","提现","निकासी","উত্তোলন","Вывод","Çekme","出金","출금"],
"transfer":["Transferência","Überweisung","Trasferimento","تحويل","转账","ट्रांसफ़र","ট্রান্সফার","Перевод","Transfer","送金","이체"],
"submit":["Enviar","Absenden","Invia","إرسال","提交","सबमिट","জমা দিন","Отправить","Gönder","送信","제출"],
"operation_history":["Histórico de operações","Transaktionsverlauf","Cronologia operazioni","سجل العمليات","操作记录","लेनदेन इतिहास","অপারেশন ইতিহাস","История операций","İşlem geçmişi","操作履歴","작업 기록"],
"account":["Conta","Konto","Account","الحساب","账户","खाता","অ্যাকাউন্ট","Аккаунт","Hesap","アカウント","계정"],
"privacy":["Privacidade","Datenschutz","Privacy","الخصوصية","隐私","गोपनीयता","গোপনীয়তা","Конфиденциальность","Gizlilik","プライバシー","개인정보"],
"lists":["Listas","Listen","Liste","القوائم","列表","सूचियाँ","লিস্ট","Списки","Listeler","リスト","목록"],
"notifications":["Notificações","Benachrichtigungen","Notifiche","الإشعارات","通知","सूचनाएँ","নোটিফিকেশন","Уведомления","Bildirimler","通知","알림"],
"storage_data":["Armazenamento e dados","Speicher und Daten","Archiviazione e dati","التخزين والبيانات","存储和数据","स्टोरेज और डेटा","স্টোরেজ ও ডেটা","Хранилище и данные","Depolama ve veriler","ストレージとデータ","저장공간 및 데이터"],
"accessibility":["Acessibilidade","Barrierefreiheit","Accessibilità","إمكانية الوصول","辅助功能","सुलभता","অ্যাক্সেসিবিলিটি","Спец. возможности","Erişilebilirlik","アクセシビリティ","접근성"],
"app_language":["Idioma do app","App-Sprache","Lingua dell’app","لغة التطبيق","应用语言","ऐप की भाषा","অ্যাপের ভাষা","Язык приложения","Uygulama dili","アプリの言語","앱 언어"],
"invite_contact":["Convidar contato","Kontakt einladen","Invita contatto","دعوة جهة اتصال","邀请联系人","संपर्क आमंत्रित करें","কন্ট্যাক্ট আমন্ত্রণ","Пригласить контакт","Kişi davet et","連絡先を招待","연락처 초대"],
"connection_security":["Conexão e segurança","Verbindung und Sicherheit","Connessione e sicurezza","الاتصال والأمان","连接与安全","कनेक्शन और सुरक्षा","সংযোগ ও নিরাপত্তা","Подключение и безопасность","Bağlantı ve güvenlik","接続とセキュリティ","연결 및 보안"],
"password":["Senha","Passwort","Password","كلمة المرور","密码","पासवर्ड","পাসওয়ার্ড","Пароль","Şifre","パスワード","비밀번호"],
"email":["E-mail","E-Mail-Adresse","E-mail","البريد الإلكتروني","电子邮件","ईमेल","ইমেইল","Эл. почта","E-posta","メールアドレス","이메일"],
"two_step":["Verificação em duas etapas","Bestätigung in zwei Schritten","Verifica in due passaggi","التحقق بخطوتين","两步验证","दो-चरण सत्यापन","দুই ধাপ যাচাই","Двухэтапная проверка","İki adımlı doğrulama","2段階認証","2단계 인증"],
"security_notifications":["Notificações de segurança","Sicherheitsbenachrichtigungen","Notifiche di sicurezza","إشعارات الأمان","安全通知","सुरक्षा सूचनाएँ","নিরাপত্তা নোটিফিকেশন","Уведомления безопасности","Güvenlik bildirimleri","セキュリティ通知","보안 알림"],
"your_account":["Sua conta","Ihr Konto","Il tuo account","حسابك","你的账户","आपका खाता","আপনার অ্যাকাউন্ট","Ваш аккаунт","Hesabınız","あなたのアカウント","내 계정"],
"change_phone":["Alterar número de telefone","Telefonnummer ändern","Cambia numero di telefono","تغيير رقم الهاتف","更改电话号码","फ़ोन नंबर बदलें","ফোন নম্বর পরিবর্তন","Изменить номер телефона","Telefon numarasını değiştir","電話番号を変更","전화번호 변경"],
"delete_account":["Excluir conta","Konto löschen","Elimina account","حذف الحساب","删除账户","खाता हटाएँ","অ্যাকাউন্ট মুছুন","Удалить аккаунт","Hesabı sil","アカウントを削除","계정 삭제"],
"online_presence":["Presença online","Online-Status","Presenza online","الظهور على الإنترنت","在线状态","ऑनलाइन उपस्थिति","অনলাইন উপস্থিতি","Онлайн-статус","Çevrimiçi durumu","オンライン状態","온라인 상태"],
"everyone":["Todos","Alle","Tutti","الجميع","所有人","सभी","সবাই","Все","Herkes","全員","모두"],
"nobody":["Ninguém","Niemand","Nessuno","لا أحد","无人","कोई नहीं","কেউ না","Никто","Hiç kimse","誰もいない","아무도 없음"],
"profile_photo":["Foto do perfil","Profilbild","Foto profilo","صورة الملف","头像","प्रोफ़ाइल फ़ोटो","প্রোফাইল ছবি","Фото профиля","Profil fotoğrafı","プロフィール写真","프로필 사진"],
"read_receipts":["Confirmações de leitura","Lesebestätigungen","Conferme di lettura","إيصالات القراءة","已读回执","रीड रिसीट","পঠিত নিশ্চিতকরণ","Отчёты о прочтении","Okundu bilgisi","既読通知","읽음 확인"],
"disappearing_messages":["Mensagens temporárias","Selbstlöschende Nachrichten","Messaggi effimeri","الرسائل ذاتية الاختفاء","自动消失消息","गायब होने वाले संदेश","অদৃশ্য বার্তা","Исчезающие сообщения","Süreli mesajlar","消えるメッセージ","사라지는 메시지"],
"theme":["Tema","Design","Tema","السمة","主题","थीम","থিম","Тема","Tema","テーマ","테마"],
"light":["Claro","Hell","Chiaro","فاتح","浅色","हल्का","হালকা","Светлая","Açık","ライト","라이트"],
"dark":["Escuro","Dunkel","Scuro","داكن","深色","डार्क","ডার্ক","Тёмная","Koyu","ダーク","다크"],
"font_size":["Tamanho da fonte","Schriftgröße","Dimensione carattere","حجم الخط","字体大小","फ़ॉन्ट आकार","ফন্ট সাইজ","Размер шрифта","Yazı tipi boyutu","フォントサイズ","글꼴 크기"],
"message_sound":["Som das mensagens","Nachrichtentöne","Suono messaggi","صوت الرسائل","消息声音","संदेश ध्वनि","মেসেজ সাউন্ড","Звуки сообщений","Mesaj sesi","メッセージ音","메시지 소리"],
"reminders":["Lembretes","Erinnerungen","Promemoria","التذكيرات","提醒","रिमाइंडर","রিমাইন্ডার","Напоминания","Hatırlatmalar","リマインダー","리마인더"],
"messages":["Mensagens","Nachrichten","Messaggi","الرسائل","消息","संदेश","মেসেজ","Сообщения","Mesajlar","メッセージ","메시지"],
"reactions":["Reações","Reaktionen","Reazioni","التفاعلات","回应","प्रतिक्रियाएँ","রিঅ্যাকশন","Реакции","Tepkiler","リアクション","반응"],
"auto_download":["Download automático","Automatischer Download","Download automatico","التنزيل التلقائي","自动下载","ऑटो डाउनलोड","অটো ডাউনলোড","Автозагрузка","Otomatik indirme","自動ダウンロード","자동 다운로드"],
"never":["Nunca","Nie","Mai","أبدًا","从不","कभी नहीं","কখনও না","Никогда","Asla","なし","안 함"],
"contact_support":["Contatar suporte","Support kontaktieren","Contatta supporto","الاتصال بالدعم","联系支持","सहायता से संपर्क करें","সহায়তায় যোগাযোগ","Связаться с поддержкой","Destekle iletişim","サポートに連絡","지원 문의"],
"modify_profile":["Editar perfil","Profil bearbeiten","Modifica profilo","تعديل الملف","编辑资料","प्रोफ़ाइल संपादित करें","প্রোফাইল সম্পাদনা","Редактировать профиль","Profili düzenle","プロフィールを編集","프로필 편집"],
"business_info":["Informações da empresa","Unternehmensinformationen","Informazioni aziendali","معلومات النشاط","商家信息","व्यवसाय जानकारी","ব্যবসার তথ্য","Информация о бизнесе","İşletme bilgileri","ビジネス情報","비즈니스 정보"],
"buyer":["Comprador","Käufer","Acquirente","مشتري","买家","खरीदार","ক্রেতা","Покупатель","Alıcı","購入者","구매자"],
"seller":["Vendedor","Verkäufer","Venditore","بائع","卖家","विक्रेता","বিক্রেতা","Продавец","Satıcı","販売者","판매자"],
"other_business":["Outra empresa","Anderes Unternehmen","Altra impresa","نشاط آخر","其他企业","अन्य व्यवसाय","অন্যান্য ব্যবসা","Другой бизнес","Diğer işletme","その他のビジネス","기타 비즈니스"],
"investor":["Investidor","Investor","Investitore","مستثمر","投资者","निवेशक","বিনিয়োগকারী","Инвестор","Yatırımcı","投資家","투자자"],
"products_services":["Produtos e serviços","Produkte und Dienstleistungen","Prodotti e servizi","المنتجات والخدمات","产品和服务","उत्पाद और सेवाएँ","পণ্য ও সেবা","Товары и услуги","Ürünler ve hizmetler","商品とサービス","제품 및 서비스"],
"catalog":["Catálogo","Katalog","Catalogo","الكتالوج","目录","कैटलॉग","ক্যাটালগ","Каталог","Katalog","カタログ","카탈로그"],
"location":["Localização","Standort","Posizione","الموقع","位置","स्थान","লোকেশন","Местоположение","Konum","位置情報","위치"],
"virtual_assistant":["Assistente virtual","Virtueller Assistent","Assistente virtuale","مساعد افتراضي","虚拟助手","वर्चुअल असिस्टेंट","ভার্চুয়াল সহকারী","Виртуальный помощник","Sanal asistan","バーチャルアシスタント","가상 도우미"],
"no_chats":["Nenhuma conversa para este filtro.","Keine Chats für diesen Filter.","Nessuna chat per questo filtro.","لا توجد دردشات لهذا الفلتر.","此筛选条件下没有聊天。","इस फ़िल्टर के लिए कोई चैट नहीं है।","এই ফিল্টারে কোনো চ্যাট নেই।","Нет чатов для этого фильтра.","Bu filtre için sohbet yok.","このフィルターに該当するチャットはありません。","이 필터에 해당하는 채팅이 없습니다."],
"no_notifications":["Sem notificações.","Keine Benachrichtigungen.","Nessuna notifica.","لا توجد إشعارات.","暂无通知。","कोई सूचना नहीं।","কোনো নোটিফিকেশন নেই।","Нет уведомлений.","Bildirim yok.","通知はありません。","알림이 없습니다."]
};

const reverse=new Map();
for(const [key,vals] of Object.entries(D)){
  vals.forEach(v=>{if(v)reverse.set(v.trim(),key)});
}
for(const [key,vals] of Object.entries(X)){
  vals.forEach(v=>{if(v)reverse.set(v.trim(),key)});
}
for(const [src,key] of Object.entries(extraAliases))reverse.set(src,key);
reverse.set("Pa gen discussion pou filtè sa a.","no_chats");
reverse.set("No chats for this filter.","no_chats");

let lang=saved();
const nodeKeys=new WeakMap();
const attrKeys=new WeakMap();

function tr(key){
  const e=D[key]; if(!e)return key;
  const baseIndex=["ht","fr","en","es"].indexOf(lang);
  if(baseIndex>=0)return e[baseIndex]||e[2]||e[0]||key;
  const extraIndex=EXTRA_LANGS.indexOf(lang);
  if(extraIndex>=0&&X[key]?.[extraIndex])return X[key][extraIndex];
  return e[2]||e[0]||key;
}
function infer(s){
  const clean=String(s??"").replace(/\s+/g," ").trim();
  if(!clean)return null;
  if(reverse.has(clean))return reverse.get(clean);
  // Dynamic counts.
  let m=clean.match(/^(\d+) contacts?$/i);if(m)return {kind:"contactCount",n:m[1]};
  return null;
}
function contactCount(n){
  const x=Number(n)||0;
  if(lang==="ht")return x+" kontak";
  if(lang==="fr")return x+" contact"+(x>1?"s":"");
  if(lang==="en")return x+" contact"+(x===1?"":"s");
  return x+" contacto"+(x===1?"":"s");
}
function translateTextNode(n){
  if(!n||n.nodeType!==3)return;
  const raw=n.nodeValue;
  const lead=raw.match(/^\s*/)?.[0]||"", trail=raw.match(/\s*$/)?.[0]||"";
  const core=raw.trim();if(!core)return;
  let key=nodeKeys.get(n);
  if(!key){key=infer(core);if(key)nodeKeys.set(n,key)}
  if(!key)return;
  const value=typeof key==="object"&&key.kind==="contactCount"?contactCount(key.n):tr(key);
  if(value&&core!==value)n.nodeValue=lead+value+trail;
}
function translateAttrs(el){
  if(!(el instanceof Element))return;
  for(const attr of ["placeholder","title","aria-label"]){
    if(!el.hasAttribute(attr))continue;
    const kId=attr+":"+el.getAttribute(attr);
    let map=attrKeys.get(el)||{};
    let key=map[attr];
    if(!key){key=infer(el.getAttribute(attr));if(key){map[attr]=key;attrKeys.set(el,map)}}
    if(key)el.setAttribute(attr,typeof key==="object"&&key.kind==="contactCount"?contactCount(key.n):tr(key));
  }
}
function walk(root=document.body){
  if(!root)return;
  if(root.nodeType===3){translateTextNode(root);return}
  if(root.nodeType===1)translateAttrs(root);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let n;while((n=w.nextNode()))translateTextNode(n);
  if(root.querySelectorAll)root.querySelectorAll("[placeholder],[title],[aria-label]").forEach(translateAttrs);
}
function setLang(next){
  if(!LANGS.includes(next))next="ht";
  lang=next;localStorage.setItem("wbp_lang",next);
  document.documentElement.lang=next;
  document.documentElement.dir=next==="ar"?"rtl":"ltr";
  const select=document.querySelector("#lang");if(select&&select.value!==next)select.value=next;
  const settings=document.querySelector("#settingsLanguage");if(settings&&settings.value!==next)settings.value=next;
  walk(document.body);
  window.dispatchEvent(new CustomEvent("wbp-language-changed",{detail:{lang:next}}));
}
window.WBP_T=(value)=>{
  const key=infer(value);
  if(!key)return value;
  return typeof key==="object"&&key.kind==="contactCount"?contactCount(key.n):tr(key);
};
window.WBP_SET_LANG=setLang;
window.WBP_GET_LANG=()=>lang;
window.WBP_TRANSLATE=()=>walk(document.body);

function bind(){
  const s=document.querySelector("#lang");
  if(s){s.value=lang;s.addEventListener("change",()=>setLang(s.value))}
  const ss=document.querySelector("#settingsLanguage");
  if(ss){ss.value=lang;ss.addEventListener("change",()=>setLang(ss.value))}
  walk(document.body);
  const mo=new MutationObserver(ms=>{
    for(const m of ms){
      if(m.type==="characterData")translateTextNode(m.target);
      else m.addedNodes.forEach(n=>walk(n));
    }
  });
  mo.observe(document.body,{subtree:true,childList:true,characterData:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();
})();
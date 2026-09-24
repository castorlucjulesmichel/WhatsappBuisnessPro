(() => {
"use strict";

const LANGS=["ht","fr","en","es"];
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

const reverse=new Map();
for(const [key,vals] of Object.entries(D)){
  vals.forEach(v=>{if(v)reverse.set(v.trim(),key)});
}
for(const [src,key] of Object.entries(extraAliases))reverse.set(src,key);

let lang=saved();
const nodeKeys=new WeakMap();
const attrKeys=new WeakMap();

function tr(key){const e=D[key];if(!e)return key;return e[LANGS.indexOf(lang)]||e[0]||key}
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
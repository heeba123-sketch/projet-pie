/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

interface ServerProduct {
  id: string;
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  sellerName: string;
  isCertified: boolean;
  likes: number;
  isUserAdded?: boolean;
  voiceMemoUrl?: string;
}

const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

// Initialize default database records
const DEFAULT_DB = {
  kits: [
    {
      id: "kit-1",
      title: {
        ar: "صندوق الصوف كوكو المبتدئ",
        tmz: "Box n'Koko Tamzwarout",
        fr: "Kit Débutant Coco - Crochet",
        en: "Coco Starter Crochet Kit"
      },
      price: 120,
      description: {
        ar: "صندوق كامل لتعليم الكروشي الأول. فيه صوف كوكو غليظ وإبرة 4 ملم.",
        tmz: "Box i-lemden krouchi. Ssof ikhedmen d needle 4mm.",
        fr: "Le coffret parfait pour débuter le crochet. Contient de la laine épaisse Coco blanche et un crochet de 4mm.",
        en: "The perfect box to start crocheting. Includes thick white Coco yarn and a 4mm crochet."
      },
      whatsInside: [
        { ar: "حزمة صوف طبيعي 100 غرام", tmz: "Ssof natural 100g", fr: "Pelote de laine blanche 100% coton (100g)", en: "White cotton yarn skein (100g)" },
        { ar: "كروشي خشبي 4 ملم", tmz: "Crochet n'akchoud 4mm", fr: "Crochet ergonomique en bambou (4mm)", en: "Ergonomic bamboo hook (4mm)" },
        { ar: "إبرة بلاستيكية لجمع الخيط", tmz: "Needle n'Plastik", fr: "Aiguille à laine en plastique", en: "Plastic finishing needle" },
        { ar: "بطاقات اللمس التفسيرية", tmz: "Tewlafin l'maâlma", fr: "Fiches tactiles de points en relief", en: "Tactile stitch guides with visual relief" }
      ],
      imageUrl: "/assets/kit_coco_crochet.jpg",
      colorHex: "#F5F5DC"
    },
    {
      id: "kit-2",
      title: {
        ar: "صندوق الشغف الكرزي",
        tmz: "Box Passion Cerise d'Khayt",
        fr: "Kit Passion Cerise - Broderie",
        en: "Cherry Passion Embroidery Kit"
      },
      price: 150,
      description: {
        ar: "صندوق يعلمك طرز الورود بخيط ملون وقرص خشبي مرن.",
        tmz: "Box i-tzegawt n rkham. Ikat ar-rcham d daira n akchoud.",
        fr: "Apprenez l'art de la broderie florale. Comprend un tambour en bois et des fils de coton rouge cerise.",
        en: "Learn floral embroidery with ease. Includes a wooden embroidery frame and cherry cotton threads."
      },
      whatsInside: [
        { ar: "قرص مرن مغربي من خشب الزان", tmz: "Circle n'akchoud", fr: "Tambour à broder en bois de hêtre (15cm)", en: "Beechwood embroidery hoop (15cm)" },
        { ar: "5 بكرات خيوط قطنية ملونة", tmz: "5 tloust n khayt coloré", fr: "5 écheveaux de fils de coton mouliné", en: "5 colorful cotton thread skeins" },
        { ar: "ثوب كتان مرسوم عليه الطرز", tmz: "Thoub n l'kettan l'mersoum", fr: "Toile de lin avec motif pré-tracé", en: "Natural linen canvas with pre-transferred motif" },
        { ar: "إبر تطريز فولاذية", tmz: "Insk n krouchi", fr: "Assortiment d'aiguilles de précision", en: "Professional metal needles kit" }
      ],
      imageUrl: "/assets/kit_passion_cerise.png",
      colorHex: "#8B0000"
    },
    {
      id: "kit-3",
      title: {
        ar: "صندوق الأطلس الأمازيغي",
        tmz: "Box n'Atlas l'Ahmar",
        fr: "Kit Atlas Royal - Tissage Traditionnel",
        en: "Royal Atlas Traditional Weaving Kit"
      },
      price: 180,
      description: {
        ar: "صندوق فخم من تقاليد الأطلس فيه خيط صوف أحمر أصيل لتعلم المنسج العائلي.",
        tmz: "Box n'Ahmar l'Atlas. Ssof awragh d tkharay n tizgawt.",
        fr: "Plongez dans l'héritage berbère. Confectionnez un mini-tissage mural inspiré des motifs géométriques de l'Atlas.",
        en: "Discover Berber heritage. Create a small wall weaving matching traditional geometric Atlas designs."
      },
      whatsInside: [
        { ar: "منسج خشبي صغير نقال", tmz: "L'mesraj n akchoud sghir", fr: "Cadre de tissage en bois portatif", en: "Portable wooden loom frame" },
        { ar: "صوف الغنم الطبيعي المصبوغ يدوياً", tmz: "Ssof n tixri dyed l'yed", fr: "Laine de brebis pure filée main", en: "Hand-spun pure virgin sheep wool" },
        { ar: "المشط الخشبي التقليدي للضغط", tmz: "Agelzim n ssof", fr: "Peigne à tisser traditionnel en bois", en: "Traditional wooden weaving comb" },
        { ar: "دليل صوتي مسجل في شريحة", tmz: "Imesra' d saout", fr: "Livre de motifs géométriques et guide", en: "Geometric pattern templates guide" }
      ],
      imageUrl: "/assets/kit_atlas_royal.png",
      colorHex: "#FF4500"
    }
  ],
  tutorials: [
    {
      id: "course-1",
      metier: "crochet",
      linkedKitId: "kit-1",
      title: {
        ar: "الكروشي: عقدة البداية الأولى",
        tmz: "Krouchi: Oqqan Tamzwarout",
        fr: "Crochet - La première boucle : Le nœud coulant",
        en: "Crochet - First Stitch: The slip knot"
      },
      description: {
        ar: "أساس كل عمل في الكروشي. عقدة ساهلة دور الخيط على صبعك وجر.",
        tmz: "Aslas n krouchi. Aqan isehlan ssof f ouda nnek.",
        fr: "La base de tout travail. Créez votre première boucle coulissante sur le crochet.",
        en: "The foundation of all crochet. Twist the thread around your finger and pull securely."
      },
      difficulty: "facile",
      duration: "3 min",
      videoMockName: "slip-knot",
      videoEmbedId: "n8A-H8U_8e0",
      exercise: {
        title: {
          ar: "تمرين: صنع نبيذة صغيرة دائرية للزينة",
          tmz: "Exercise: Napperon n'akchoud stasraft",
          fr: "Exercice : Confectionner un Napperon Dentelle d'Argan",
          en: "Exercise: Knit an Argan Lace Coaster"
        },
        desc: {
          ar: "استعملي صوف كوكو الأبيض لتطبيق العقد المتتالية وصنعي أول صحن كأس دائري للبيع.",
          tmz: "Isk ssof Coco bac ad talsad napperon imzeled.",
          fr: "Utilisez la laine blanche du Kit Coco pour crocheter 5 anneaux reliés. Cet exercice fabrique un Napperon Dentelle vendu sur le souk !",
          en: "Use Coco starter white yarn to knit 5 joined loops. This process forms an Argan Lace coaster ready for sale!"
        },
        earnPrice: 180,
        outputProductId: "prod-2"
      },
      steps: [
        {
          stepNumber: 1,
          instruction: {
            ar: "دور خيط الصوف على صبع السبابة مرتين حتى تولي علامة الكروس.",
            tmz: "Gar ssof f oudad ssin tikal s tewlafin X.",
            fr: "Enroulez le fil de laine deux fois autour de votre index pour former un 'X'.",
            en: "Wrap the wool string twice around your index finger forming an 'X' shape."
          },
          animationKey: "wrap-finger"
        },
        {
          stepNumber: 2,
          instruction: {
            ar: "دخل الإبرة تحت الخيط اللول، وجر الخيط الثاني لوراه ببطء.",
            tmz: "Inra needle s d'ssof amzwarou, tafejd ssof wiss sin.",
            fr: "Glissez le crochet sous le premier fil, et attrapez le deuxième fil pour l'amener en arrière.",
            en: "Slide the hook under the first loop, latch the second wire and pull it backward gently."
          },
          animationKey: "pull-loop"
        },
        {
          stepNumber: 3,
          instruction: {
            ar: "حيد صبعك وزير العقدة حتى تولي لزجة ومريحة على الإبرة.",
            tmz: "Kkes oudad nnek, tqenad oqqan d needle.",
            fr: "Retirez doucement votre doigt et tirez sur les fils pour ajuster le nœud sans trop serrer.",
            en: "Remove your finger carefully and pull either thread ends to adjust the loop diameter snugly."
          },
          animationKey: "snug-knot"
        }
      ]
    },
    {
      id: "course-2",
      metier: "crochet",
      linkedKitId: "kit-1",
      title: {
        ar: "الكروشي: خدمة السنسلة الطائرة",
        tmz: "Krouchi: Maille Ssensla",
        fr: "Crochet - La maille en l'air (La chaînette)",
        en: "Crochet - The Chain Stitch (Chaînette)"
      },
      description: {
        ar: "كتصنع الطول المناسب لخدمتك. فحال السنسلة ساهلة وتكرر.",
        tmz: "Asg l'hem n tixri nnek. Tamen am ssensla isehlan.",
        fr: "Créez une jolie ligne de départ en faisant glisser la laine à travers la boucle existante.",
        en: "Produce your initial baseline row by passing the hook thread continuously."
      },
      difficulty: "facile",
      duration: "5 min",
      videoMockName: "chain-stitch",
      videoEmbedId: "n8A-H8U_8e0",
      exercise: {
        title: {
          ar: "تمرين: حياكة شال صوف الشاون دافئ",
          tmz: "Exercise: Echarpe n'Chefchaouen ssof",
          fr: "Exercice : Écharpe Bleu Chefchaouen de Maâlma",
          en: "Exercise: Knit a Chefchaouen Blue Scarf"
        },
        desc: {
          ar: "كرري غرزة السلسلة لتصنعي صفوف متناسقة وتطلعي شال الصوف الأزرق.",
          tmz: "Talsad ssensla ssof azra n Chefchaouen.",
          fr: "Répétez la maille chaînette sur 50 cm pour fabriquer une Écharpe d'Atlas. Idéal pour être listé au souk !",
          en: "Repeat the chain stitch for 50 cm to create a blue Chefchaouen winter scarf to list in the souk!"
        },
        earnPrice: 250,
        outputProductId: "prod-1"
      },
      steps: [
        {
          stepNumber: 1,
          instruction: {
            ar: "شد الكروشي بحال القلم، والخيط مرخي فاليد اليسرى.",
            tmz: "Amezd crochet am rqlam, ssof irkhad f uffus dyalk.",
            fr: "Tenez votre crochet comme un stylo de la main droite, et tendez légèrement le fil de la main gauche.",
            en: "Hold your crochet needle like a pencil, with the yarn loosely draped over your left hand."
          },
          animationKey: "hold-needle"
        },
        {
          stepNumber: 2,
          instruction: {
            ar: "لوي الخيط على راس الإبرة دور واحد من اللور للقدام.",
            tmz: "Zzer ssof ifigh f needle gar tewlaft.",
            fr: "Enroulez la laine autour du crochet d'arrière en avant (faites un jeté).",
            en: "Wrap the yarn or thread around the upper head of the hook from back to front."
          },
          animationKey: "yarn-over"
        },
        {
          stepNumber: 3,
          instruction: {
            ar: "دخل راس الإبرة وسط العقدة اللي كانت عندك وجرها لبرة.",
            tmz: "Tasefd needle n'ssof f oqqan isghem out.",
            fr: "Faites pivoter la tête du crochet vers le bas et tirez le fil à travers la boucle de votre nœud.",
            en: "Rotate the hook point slightly downward to drag the yarn clean through your active loop."
          },
          animationKey: "pull-through"
        }
      ]
    },
    {
      id: "course-3",
      metier: "crochet",
      linkedKitId: "kit-1",
      title: {
        ar: "الكروشي: وردة د الأركان السحرية",
        tmz: "Krouchi: Tarjich n n'Argan",
        fr: "Crochet - Le Motif de Fleur d'Arganier",
        en: "Crochet - The Argan Flower Stitch"
      },
      description: {
        ar: "زواقة كروشي تقليدية ممتازة كتشبه للوردة. زيري باش تطلع مفكسية.",
        tmz: "Motif Argan tasebhaht krouchi. Lemmed asg.",
        fr: "Créez une splendide rosace en relief inspirée de l'arbre d'Arganier du Souss.",
        en: "Learn a floral motif design inspired by Souss valley's sacred Argan flower."
      },
      difficulty: "moyen",
      duration: "8 min",
      videoMockName: "argan-stitch",
      videoEmbedId: "CgH6q309wJw",
      exercise: {
        title: {
          ar: "تمرين: تصميم حقيبة رافية صيفية ذهبية",
          tmz: "Exercise: Sac Cabas n'Soleil",
          fr: "Exercice : Sac Cabas Mandala du Soleil",
          en: "Exercise: Weave a Sunny Boho Tote Bag"
        },
        desc: {
          ar: "اجمعي تلاتة ديال زواقات الوردة لخدمة حقيبة شاطئ عصرية وتكسبي ثمن مزيان.",
          tmz: "Asefed krad n argan motifs n'sac cabas.",
          fr: "Assemblez trois fleurs d'arganier en relief pour fabriquer le Sac Cabas Boho Soleil qui vaut 320 DH au marché !",
          en: "Assemble three embossed Argan flower motifs to craft the Sunny Boho Bag valued at 320 DH!"
        },
        earnPrice: 320,
        outputProductId: "prod-3"
      },
      steps: [
        {
          stepNumber: 1,
          instruction: {
            ar: "صاوبي الدائرة السحرية: دوري الصوف جوج مرات على صبع الكبير.",
            tmz: "Asg circle n'soof ssin tikal f oudad nnek.",
            fr: "Créez un anneau magique : enroulez le fil de laine deux fois autour de votre pouce.",
            en: "Form a magic loop structure: wrap the wool yarn twice around your thumb."
          },
          animationKey: "wrap-finger"
        },
        {
          stepNumber: 2,
          instruction: {
            ar: "طرزي تلاتة ديال السلاسل الطائرة لداخل الدائرة باش تزيدي لعلو.",
            tmz: "Tarzgout ssensla f circle n'soof ad t'ali.",
            fr: "Faites trois mailles en l'air à l'intérieur de l'anneau pour donner de la hauteur.",
            en: "Chain stitch three times inside the active magic loop to build height."
          },
          animationKey: "pull-loop"
        },
        {
          stepNumber: 3,
          instruction: {
            ar: "خدمي طناشر عمود لوسط الدائرة وزيري الخيط باش يخرج الوردة مجموع.",
            tmz: "Sghem 12 kolom f circle, tqenad oqqan n rchm.",
            fr: "Faites 12 brides simples dans l'anneau, puis tirez sur le fil pour resserrer les pétales de fleur.",
            en: "Double crochet 12 loops inside and pull the tail to pack the petals firmly."
          },
          animationKey: "snug-knot"
        }
      ]
    },
    {
      id: "course-4",
      metier: "broderie",
      linkedKitId: "kit-2",
      title: {
        ar: "الطرز: غرزة الوردة الفاسية بالحرير",
        tmz: "Broderie: Tarzgout n'Fas",
        fr: "Broderie - Le Point de Nœud de Fès",
        en: "Embroidery - Fez Silk French Knot"
      },
      description: {
        ar: "غرزة فاسية تقليدية بالحرير كتصنع نقط بارزة ومطرزة غاية فالجمال.",
        tmz: "Tarzgout n silk lmou'allamat lmoghrib.",
        fr: "Le secret des détails granuleux et floraux sur les nappes marocaines brodées.",
        en: "The secret trick behind beaded floral details on premium Moroccan table clothing."
      },
      difficulty: "moyen",
      duration: "6 min",
      videoMockName: "french-knot",
      videoEmbedId: "YFv_D2C5x8Q",
      exercise: {
        title: {
          ar: "تمرين: تطريز غلاف وسادة فاسي ملكي",
          tmz: "Exercise: L'mkhda n silk n'Fas",
          fr: "Exercice : Housse de Coussin en Soie Brodée",
          en: "Exercise: List a Royal Silk Brodée Pillow"
        },
        desc: {
          ar: "استعملي ثوب الكتان من صندوق الكرز وقومي بتطريز وردة فاسية مذهبة.",
          tmz: "Sghem l'mkhda s ssof cerise n'Fas.",
          fr: "Utilisez le fil de soie et le tambour du Kit Broderie pour aligner 20 points de nœud. Vous obtiendrez une Housse Fès vendable au souk !",
          en: "Practice Fez stitches on the linen template from your Cherry Kit. Create a Royal Brodée Pillow valued at 290 DH!"
        },
        earnPrice: 295,
        outputProductId: "prod-pillow"
      },
      steps: [
        {
          stepNumber: 1,
          instruction: {
            ar: "طلعي الإبرة د الفولاذ من التحت للقدام د الثوب د الساتان.",
            tmz: "Ali needle gh d kettle n thoub f l'godam.",
            fr: "Tirez l'aiguille de l'arrière vers l'avant à travers votre toile de lin tendue.",
            en: "Bring your steel needle through the linen fabric from back to front."
          },
          animationKey: "wrap-finger"
        },
        {
          stepNumber: 2,
          instruction: {
            ar: "لوي الخيط الحريري تلاتة د المرات على راس الإبرة دورة مرخوفة.",
            tmz: "Zzer l'khayt silk ssin negh krad tikal f needle.",
            fr: "Enroulez le fil de soie trois fois autour de la pointe de l'aiguille.",
            en: "Wrap the silk thread loosely three times around the active needle point."
          },
          animationKey: "pull-loop"
        },
        {
          stepNumber: 3,
          instruction: {
            ar: "غرزي الإبرة حدا البلاصة للي خرجتيها وزيري حتا تولي غرزة منفوخة.",
            tmz: "Tasefd needle n'ssof f thoub ad tqenad.",
            fr: "Repiquez l'aiguille tout près du point de départ et tirez pour fixer la perle bro d'art.",
            en: "Re-insert the needle very close to the starting point and pull snug to form a raised knot."
          },
          animationKey: "snug-knot"
        }
      ]
    },
    {
      id: "course-5",
      metier: "tissage",
      linkedKitId: "kit-3",
      title: {
        ar: "التيسيج: نسج منسج الأطلس العريق",
        tmz: "Tissage: Mensaj n'Atlas",
        fr: "Tissage - Le Métier à Tisser de l'Atlas",
        en: "Weaving - Royal Atlas Looming"
      },
      description: {
        ar: "طريقة جمع خيوط الزربية بالطول والألوان الدافية باش تعلي لوحة منسوجة.",
        tmz: "Tixri lmounassama n ssof n n'Atlas.",
        fr: "Montez votre premier mini métier à tisser en bois et croisez la laine rouge.",
        en: "Mount your first miniature wall rug weaving project using warm Atlas crimson wool."
      },
      difficulty: "expert",
      duration: "10 min",
      videoMockName: "carpet-weaving",
      videoEmbedId: "5F_O8t_v7sY",
      exercise: {
        title: {
          ar: "تمرين: حياكة بساط جداري أمازيغي زاهي",
          tmz: "Exercise: Mini-tapis Atlas n'akchoud",
          fr: "Exercice : Mini Tapis de l'Atlas aux Couleurs Chaudes",
          en: "Exercise: Weave a Miniature Red Atlas Tapestry"
        },
        desc: {
          ar: "نسجي الصوف الطبيعي الملون وضغطي بالمنسج الخشبي لإنشاء زربية صغيرة للجدار.",
          tmz: "Lemmed tixri mini-rug n'Atlas ssof hmar.",
          fr: "Croisez la laine rouge et or sur le mini-métier et tassez au peigne pour façonner un chef-d'œuvre mural d'Atlas d'une valeur de 450 DH !",
          en: "Combine rich red & yellow virgin wool onto your table loom frame. Form a stunning geometric Berber room coaster valued at 450 DH!"
        },
        earnPrice: 450,
        outputProductId: "prod-rug"
      },
      steps: [
        {
          stepNumber: 1,
          instruction: {
            ar: "دوزي خيوط الصوف بالطول ما بين سواري المنسج د اللوح.",
            tmz: "Inra ssof f lmensaj n akchoud s l'haqq tasekla.",
            fr: "Tendez les fils de chaîne verticaux parallèlement sur le cadre en bois de hêtre.",
            en: "String raw vertical warp threads parallelly across your wooden frame."
          },
          animationKey: "wrap-finger"
        },
        {
          stepNumber: 2,
          instruction: {
            ar: "دخلي الخيط الذهبي بالعرض مرة لفوق ومرة للتحت د خيوط المنسج.",
            tmz: "Tasefd l'khayt n ssof awragh g lmounassama.",
            fr: "Passez la navette de laine rouge horizontalement une fois dessous, une fois dessus.",
            en: "Weave the gold weft string horizontally over and under alternate warp strands."
          },
          animationKey: "pull-loop"
        },
        {
          stepNumber: 3,
          instruction: {
            ar: "بركي مزيان ب المشط د اللوح للي فالصندوق باش تزير الخدمة وتجي متينة.",
            tmz: "Tqenad s ougelzim n akchoud bac ad iser.",
            fr: "Tassez fermement la rangée de laine verte avec le peigne traditionnel en bois.",
            en: "Pack down the row tightly using the traditional heavy-weight wooden comb."
          },
          animationKey: "snug-knot"
        }
      ]
    },
    {
      id: "course-6",
      metier: "poterie",
      linkedKitId: "kit-potery",
      title: {
        ar: "الفخار: نقش وعجن الطين السلاوي",
        tmz: "Poterie: Talekht n'Safi",
        fr: "Poterie - Le Modelage en Argile de Safi",
        en: "Pottery - Clay Sculpting on Potter's Wheel"
      },
      description: {
        ar: "فن عجن الطين الرمادي وتشكيل أواني الطاجين الفاسي الرائعة بيدك على اللولب.",
        tmz: "Tlemmed talekht, tajin n'argile isehlan.",
        fr: "Apprenez à mouler de l'argile naturelle sur un tour rotatif pour cuire votre premier tajine.",
        en: "Sculpt damp Moroccan red clay onto a rotating wheel to form a rustic kitchen tajine."
      },
      difficulty: "expert",
      duration: "12 min",
      videoMockName: "clay-molding",
      videoEmbedId: "E-0gD2Zq8rQ",
      exercise: {
        title: {
          ar: "تمرين: صنع طاجين طيني أصيل ب غطاء مخروطي",
          tmz: "Exercise: Tajine n'argile n'Safi",
          fr: "Exercice : Tajine de Safi en Argile Polie",
          en: "Exercise: Sculpt a Safi Clay Cooking Tajine"
        },
        desc: {
          ar: "اعجني قطعة طين دائرية، استعملي لولب الدوران لتشكيل وتمليس وعاء الطاجين وغطاءه.",
          tmz: "Sghem tajine n'argile f tour rotatif.",
          fr: "Centrez l'argile du Kit Potterie sur le plateau, élevez la coupe avec vos pouces et formez le couvercle conique. Valeur : 190 DH !",
          en: "Center the wet clay on the wheel, push down to expand the hollow bowl, and carve the conic cover. Market value: 190 DH!"
        },
        earnPrice: 190,
        outputProductId: "prod-tajin"
      },
      steps: [
        {
          stepNumber: 1,
          instruction: {
            ar: "حطي كرة الطين الرمادي في وسط اللولب الدائري وبللي يدك بالماء مزيان.",
            tmz: "Asefed talekht f tour rotatif d aman f uffus.",
            fr: "Placez la boule d'argile humide exactement au centre du tour de potier en rotation et mouillez vos paumes.",
            en: "Place the damp clay ball exactly in the center of the rotating potter wheel, wet your hands."
          },
          animationKey: "wrap-finger"
        },
        {
          stepNumber: 2,
          instruction: {
            ar: "بركي بصوابعك بجوج لداخل حتى تفرغي الطين من الوسط وتطلعي وعاء غارق.",
            tmz: "Tasefd oudad gh talekht ad t'ali l'haqq sghir.",
            fr: "Pressez vos deux pouces au milieu pour creuser le cœur de l'argile et étirez les parois vers le haut.",
            en: "Press your thumbs in the center of the clay, slowly drawing them upward to raise the thin cylinder wall."
          },
          animationKey: "pull-loop"
        },
        {
          stepNumber: 3,
          instruction: {
            ar: "ملسي السطح ب الإسفنجة المبللة حتى يتفيكسا شكل وعاء الطاجين الدائري.",
            tmz: "Tqenad talekht s l'esponj bac ad iser smooth.",
            fr: "Lissez le contour extérieur avec une éponge humide pour fignoler le rebord circulaire de cuisson.",
            en: "Smooth the outer boundaries using a damp sponge while rotating to complete the rim."
          },
          animationKey: "snug-knot"
        }
      ]
    }
  ],
  products: [
    {
      id: "prod-1",
      title: "Écharpe d'Atlas Ciel de Chefchaouen",
      price: 250,
      description: "عكر صوف طبيعي منسوج ومطرز يدويا من طرف المعلمة خديجة. لون ناصع مثل زرق الشاون.",
      imageUrl: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=600",
      sellerName: "Maâlma Fatima (Chefchaouen)",
      isCertified: true,
      likes: 35
    },
    {
      id: "prod-2",
      title: "Napperon Dentelle d'Argan Royal",
      price: 180,
      description: "صغار الكروش المطرز بالحرير الطبيعي. شكل دائري ممتاز للزينة والدوائر المغربية.",
      imageUrl: "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&q=80&w=600",
      sellerName: "Maâlma Zahra (Tafraout)",
      isCertified: true,
      likes: 24
    },
    {
      id: "prod-3",
      title: "Sac Cabas Boho Soleil",
      price: 320,
      description: "حقيبة يد صيفية منسوجة بالكروش خيط رافي طبيعي ذهبي. مريحة وقصح للخرجة.",
      imageUrl: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=600",
      sellerName: "Yasmine (Aït Melloul)",
      isCertified: false,
      likes: 18
    }
  ] as ServerProduct[],
  orders: [] as any[],
  adminStock: {
    "kit-1": 18,
    "kit-2": 9,
    "kit-3": 4,
    "kit-4": 14
  } as Record<string, number>
};

// Database state
let db = { ...DEFAULT_DB };

// Load Database from file
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      // Ensure the tutorials list always reflects our rich updated multi-craft curriculum
      db.tutorials = DEFAULT_DB.tutorials;
      db.adminStock = { ...DEFAULT_DB.adminStock, ...(db.adminStock || {}) };
      saveDb();
    } else {
      saveDb();
    }
  } catch (err) {
    console.error("Failed to load local database, resetting to default.", err);
    db = { ...DEFAULT_DB };
  }
}

// Save Database to file
function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to save local database.", err);
  }
}

loadDb();

const LARAVEL_API_URL = 'http://127.0.0.1:8000/api';

async function forwardToLaravel(req: express.Request, res: express.Response, path: string, method: string = 'GET', body: any = null): Promise<any | null> {
  try {
    const url = `${LARAVEL_API_URL}${path}`;
    const options: any = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).send(errText);
      return true; // request handled as error
    }
    const data = await response.json();
    res.json(data);
    return true; // request handled successfully
  } catch (err) {
    console.warn(`[Proxy Fallback] Connection to Laravel failed at ${path}. Using Express DB backup.`);
    return null; // indicates we should use fallback
  }
}

// Lazy Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return geminiClient;
}

// Keyword parsing fallback for Voice commands (in 4 languages!)
function fallbackVoiceRouting(transcript: string): any {
  const text = transcript.toLowerCase();
  
  // Navigation commands
  if (
    text.includes('krouchi') || text.includes('crochet') || text.includes('tizgawt') || 
    text.includes('tixri') || text.includes('apprendre') || text.includes('cours') || 
    text.includes('lmmed') || text.includes('darss') || text.includes('comment') ||
    text.includes('s\'entrainer') || text.includes('كروشي') || text.includes('تعلم') ||
    text.includes('درس') || text.includes('دروس') || text.includes('تعليم') ||
    text.includes('حرفة') || text.includes('طرز') || text.includes('نسج') ||
    text.includes('فخار')
  ) {
    return {
      action: 'navigate',
      target: 'learn',
      voiceResponse: {
        ar: "وخا، ها هما دبلوم ودورات كروشي للمبتدئين. بركي على العقدة الأولى باش نبداو.",
        tmz: "Aha! Khad dorous n'tizgawt. Ouy'ed aflla n tifeltt tamzwarout.",
        fr: "D'accord, voici notre école de crochet tactile. Cliquez sur la première étape pour commencer la couture virtuelle.",
        en: "No problem, opening the visual learning guides. Click on the first stitch lesson to start!"
      }
    };
  }

  if (
    text.includes('kit') || text.includes('box') || text.includes('coffret') || 
    text.includes('chra') || text.includes('acheter') || text.includes('boutique') || 
    text.includes('ssof') || text.includes('laine') || text.includes('sandouk') ||
    text.includes('panier') || text.includes('asg') || text.includes('صندوق') ||
    text.includes('صناديق') || text.includes('شراء') || text.includes('نشري') ||
    text.includes('شري') || text.includes('سلة') || text.includes('سلّة') ||
    text.includes('علبة')
  ) {
    return {
      action: 'navigate',
      target: 'kits',
      voiceResponse: {
        ar: "وخا، فتحت ليك متجر الصناديق. بركي على صندوق كوكو ولا صندوق الأطلسي باش تزيديه للسلة.",
        tmz: "Wakha, khad asg n soof tiftet. Taslt nnek tsatg.",
        fr: "D'accord, j'ouvre l'atelier d'expédition des kits. Vous pouvez acheter la laine de coton ou le tambour Atlas Royal.",
        en: "Opening the material kits shop. You can select the beginner Cotton kit or the Atlas Royal Weaving box."
      }
    };
  }

  if (
    text.includes('souk') || text.includes('souq') || text.includes('vendre') || 
    text.includes('marché') || text.includes('bi\'e') || text.includes('bi3') || 
    text.includes('creations') || text.includes('mariage') || text.includes('tzenz') ||
    text.includes('artisanat') || text.includes('maâlma') || text.includes('سوق') ||
    text.includes('بيع') || text.includes('نبيع') || text.includes('مارشي') ||
    text.includes('عرض') || text.includes('دكان')
  ) {
    return {
      action: 'navigate',
      target: 'marketplace',
      voiceResponse: {
        ar: "مزيان، دخلنا لسوق الحرفيات. هنا تقدري تبيعي الخدمة ديالك ولا تشوفي إبداع صحاباتك.",
        tmz: "Tanemmirt, khad zenz tasoult n krouchi lmou'alafat.",
        fr: "Bienvenue dans le marché solidaire des artisanes. Ici, vous pouvez vendre vos créations ou acheter du fait-main certifié.",
        en: "Welcome to the artisan marketplace. You can view custom creations or list your handmade crafts directly here."
      }
    };
  }

  if (
    text.includes('entraide') || text.includes('tadamoun') || text.includes('solidarite') || 
    text.includes('community') || text.includes('cooperative') || text.includes('zghrouta') || 
    text.includes('zgharit') || text.includes('زغاريد') || text.includes('تضامن') ||
    text.includes('مساعدة') || text.includes('تواصل') || text.includes('جمعية') ||
    text.includes('تعاون') || text.includes('زغروتة') || text.includes('مشاركة') ||
    text.includes('منشور')
  ) {
    return {
      action: 'navigate',
      target: 'community',
      voiceResponse: {
        ar: "مرحبا بيك فساحة التضامن والتعاون. هنا تقدري تسمعي لصحاباتك وتشاركي بالأصوات وتسمعي الزغاريد والتشجيع المبهج.",
        tmz: "Aha! Agraw n lmou'alafat d'tadamoun. Is khad sawalad s taniyin.",
        fr: "Bienvenue dans l'espace d'entraide et de partage de la coopérative. Écoutez vos collègues artisanes par messages vocaux et encouragez-les.",
        en: "Welcome to the mutual aid community wall. Connect with fellow crafters via voice notes and cheers!"
      }
    };
  }

  if (
    text.includes('sync') || text.includes('synchro') || text.includes('nettoyer') || 
    text.includes('connect') || text.includes('تزامن') || text.includes('تحديث') ||
    text.includes('حفظ')
  ) {
    return {
      action: 'sync',
      voiceResponse: {
        ar: "مزيان، راني كانصيفط كاع الحوايج للحاسوب المركزي ديالنا دابا. خدمة مأمنة 100 فالمية.",
        tmz: "Wakha, synchronisigh tighawsiwin nnek d'serveur.",
        fr: "Compris, je force la synchronisation sécurisée de vos données hors ligne.",
        en: "Syncing your local database to the server. All your products and cart changes are now unified."
      }
    };
  }

  // Default helpful response with guide guidance
  return {
    action: 'speak',
    voiceResponse: {
      ar: "مرحبا بيك الحرفية المغربية، راني كانسمعك. قولي ليا 'كروشي' لتعليم، 'صندوق' للشراء، أو 'سوق' للبيع.",
      tmz: "Azul fellawen! Is sawalad s taniyin, krouchi negh asg negh souk.",
      fr: "Je suis à votre écoute ! Dites simplement 'Kits' pour commander votre coffret laine, 'Crochet' pour apprendre les points, ou 'Marché' pour vendre vos chefs-d'œuvre.",
      en: "I am listening! Say 'Crochet' to learn stitches, 'Kits' to shop raw supplies, or 'Marketplace' to view artisan crafts."
    }
  };
}

// Server startup flow inside async function
async function startServer() {
  const app = express();
  app.use(express.json());

  // Static assets configuration (e.g. for user images)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  app.use('/uploads', express.static(uploadsDir));

  // --- API Routes FIRST ---

  // 1. Get kits available
  app.get('/api/kits', async (req, res) => {
    const handled = await forwardToLaravel(req, res, '/kits');
    if (!handled) res.json(db.kits);
  });

  // 2. Get courses
  app.get('/api/tutorials', async (req, res) => {
    const handled = await forwardToLaravel(req, res, '/tutorials');
    if (!handled) res.json(db.tutorials);
  });

  // 3. Get marketplace products
  app.get('/api/products', async (req, res) => {
    const handled = await forwardToLaravel(req, res, '/products');
    if (!handled) res.json(db.products);
  });

  app.get('/api/admin/summary', async (req, res) => {
    const handled = await forwardToLaravel(req, res, '/admin/summary');
    if (!handled) {
      const kitsById = new Map(db.kits.map((kit: any) => [kit.id, kit]));
      const orders = Array.isArray(db.orders) ? db.orders : [];
      const products = Array.isArray(db.products) ? db.products : [];
      const now = new Date();

      const kitUnitsSold = orders.reduce((total: number, order: any) => {
        return total + (order.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 1), 0);
      }, 0);

      const monthlyRevenue = orders.reduce((total: number, order: any) => {
        const orderDate = order.date ? new Date(order.date) : now;
        if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) return total;
        return total + (order.items || []).reduce((sum: number, item: any) => {
          const kit = kitsById.get(item.kitId) as any;
          return sum + Number(item.quantity || 1) * Number(kit?.price || 0);
        }, 0);
      }, 0);

      res.json({
        premiumSubscribers: 24,
        kitsSold: kitUnitsSold,
        monthlyCreations: products.filter((product: any) => product.isUserAdded).length,
        pendingCreations: products.filter((product: any) => !product.isCertified).length,
        monthlyRevenue,
        stock: db.kits.map((kit: any) => ({
          kitId: kit.id,
          title: kit.title.fr,
          stock: db.adminStock[kit.id] ?? 0,
          reorderAt: 8
        })),
        ordersCount: orders.length
      });
    }
  });

  // 4. Add custom handcrafted product (peer-to-peer marketplace addition)
  app.post('/api/products', async (req, res) => {
    const handled = await forwardToLaravel(req, res, '/products', 'POST', req.body);
    if (!handled) {
      const { title, price, description, imageUrl, sellerName, voiceMemoUrl } = req.body;
      if (!title || !price) {
        return res.status(400).json({ error: "Title and price are required." });
      }

      const newProduct = {
        id: `prod-user-${Date.now()}`,
        title: title,
        price: parseFloat(price),
        description: description || "Création fait-main partagée via l'interface tactile.",
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=600",
        sellerName: sellerName || "Artisane Locale",
        isCertified: false, // will require Maâlma expert approval later
        likes: 0,
        isUserAdded: true,
        voiceMemoUrl: voiceMemoUrl
      };

      db.products.unshift(newProduct);
      saveDb();
      res.status(201).json(newProduct);
    }
  });

  app.put('/api/admin/products/:id/approve', async (req, res) => {
    const handled = await forwardToLaravel(req, res, `/admin/products/${req.params.id}/approve`, 'PUT');
    if (!handled) {
      const product = db.products.find((item: any) => item.id === req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found." });
      product.isCertified = true;
      saveDb();
      res.json(product);
    }
  });

  app.delete('/api/admin/products/:id', async (req, res) => {
    const handled = await forwardToLaravel(req, res, `/admin/products/${req.params.id}`, 'DELETE');
    if (!handled) {
      const before = db.products.length;
      db.products = db.products.filter((item: any) => item.id !== req.params.id);
      if (db.products.length === before) return res.status(404).json({ error: "Product not found." });
      saveDb();
      res.json({ success: true });
    }
  });

  app.put('/api/admin/kits/:id/stock', async (req, res) => {
    const handled = await forwardToLaravel(req, res, `/admin/kits/${req.params.id}/stock`, 'PUT', req.body);
    if (!handled) {
      const stock = Number(req.body.stock);
      if (!Number.isFinite(stock) || stock < 0) {
        return res.status(400).json({ error: "Stock must be a positive number." });
      }
      const kit = db.kits.find((item: any) => item.id === req.params.id);
      if (!kit) return res.status(404).json({ error: "Kit not found." });
      db.adminStock[req.params.id] = Math.round(stock);
      saveDb();
      res.json({ kitId: req.params.id, stock: db.adminStock[req.params.id] });
    }
  });

  // 5. Submit client orders / Checkout
  app.post('/api/orders', async (req, res) => {
    const handled = await forwardToLaravel(req, res, '/orders', 'POST', req.body);
    if (!handled) {
      const { items, phone, customerNotes, userLanguage } = req.body;
      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Cart is empty." });
      }

      const newOrder = {
        id: `order-${Date.now()}`,
        items,
        phone: phone || "Non renseigné (Livraison tactile)",
        customerNotes: customerNotes || "Commande Express par icônes",
        date: new Date().toISOString(),
        userLanguage: userLanguage || "ar"
      };

      db.orders.push(newOrder);
      saveDb();
      res.status(201).json({ success: true, orderId: newOrder.id });
    }
  });

  // 6. Bulk Synchronization endpoint for Offline Support
  app.post('/api/sync', async (req, res) => {
    const handled = await forwardToLaravel(req, res, '/sync', 'POST', req.body);
    if (!handled) {
      const { products, orders } = req.body;
      let addedCount = 0;

      if (products && Array.isArray(products)) {
        products.forEach((p: any) => {
          // Prevent duplicate sync
          if (!db.products.some(existing => existing.id === p.id || (p.offlineId && existing.id.includes(p.offlineId)))) {
            db.products.unshift({
              id: p.id || `prod-sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              title: p.title,
              price: p.price,
              description: p.description,
              imageUrl: p.imageUrl,
              sellerName: p.sellerName || "Artisane connectée",
              isCertified: false,
              likes: 0,
              isUserAdded: true,
              voiceMemoUrl: p.voiceMemoUrl
            });
            addedCount++;
          }
        });
      }

      if (orders && Array.isArray(orders)) {
        orders.forEach((o: any) => {
          if (!db.orders.some(existing => existing.id === o.id)) {
            db.orders.push({
              id: o.id || `order-sync-${Date.now()}`,
              items: o.items,
              phone: o.phone,
              customerNotes: o.customerNotes || "Commande synchronisée depuis le mode hors-ligne",
              date: o.date || new Date().toISOString()
            });
          }
        });
      }

      if (addedCount > 0 || (orders && orders.length > 0)) {
        saveDb();
      }

      res.json({ success: true, syncedProducts: addedCount, syncedOrders: orders ? orders.length : 0 });
    }
  });

  // 7. Gemini-Powered SMART Voice Assistant
  // Translates natural speech coordinates to specific app directives in Darija/Berber/French/English
  app.post('/api/voice-assistant', async (req, res) => {
    const { transcript, activeLanguage } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Transcript required." });
    }

    console.log(`Analyzing transcript: "${transcript}" in current language context: ${activeLanguage}`);

    const ai = getGemini();

    if (!ai) {
      // Return beautiful, fast fallback analysis in case Gemini API is not yet activated/configured
      console.log("Gemini API key not configured or lazy init failed. Using high-fidelity keyword routing fallback.");
      const fallbackResult = fallbackVoiceRouting(transcript);
      return res.json(fallbackResult);
    }

    try {
      const prompt = `You are the core vocal-first accessibility router for 'Projet Pie', an inclusive crochet & embroidery marketplace for Moroccan crafts.
The application is used by illiterate artisans ('analphabètes') who command the screen using short spoken words in Moroccan Arabic (Darija), Berber/Tamazight (Latin phonetic spelled or standard), French, or English.

Your job is to analyze the user's spoken transcript: "${transcript}"
And decide:
1. What action to take: 'navigate' (page transition), 'add_to_cart' (buying specified craft kit), 'sync' (synchronization of database) or 'speak' (explaining features).
2. If 'navigate', what is the target ('home', 'learn', 'kits', 'marketplace', 'community').
3. What is the warm voice response that our text-to-speech speaker must say back to reassure the user.
Provide this response in all 4 required languages:
- 'ar' (Darija written in Arabic script)
- 'tmz' (Tamazight spelled in friendly phonetic Latin text so a French synthesizer can vocalize it, e.g. "Azoul..." or "lemmed krouchi isehlan")
- 'fr' (French)
- 'en' (English)

Respond ONLY with a valid JSON document matching this structure:
{
  "action": "navigate" | "add_to_cart" | "sync" | "speak",
  "target": "home" | "learn" | "kits" | "marketplace" | "community",
  "item": "specific kit id or name if they mentioned a purchase, otherwise empty",
  "voiceResponse": {
    "ar": "La dorous alkrouchi assahla hna...",
    "tmz": "Tifer t'lemmed tamezwarout...",
    "fr": "D'accord, dirigeons-nous vers l'atelier de crochet...",
    "en": "Opening the beginner lessons as requested..."
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              target: { type: Type.STRING },
              item: { type: Type.STRING },
              voiceResponse: {
                type: Type.OBJECT,
                properties: {
                  ar: { type: Type.STRING },
                  tmz: { type: Type.STRING },
                  fr: { type: Type.STRING },
                  en: { type: Type.STRING }
                },
                required: ["ar", "tmz", "fr", "en"]
              }
            },
            required: ["action", "voiceResponse"]
          }
        }
      });

      const textOutput = response.text;
      if (textOutput) {
        const payload = JSON.parse(textOutput.trim());
        res.json(payload);
      } else {
        throw new Error("Empty gemini output");
      }
    } catch (err) {
      console.error("Gemini assistant error, falling back to keywords:", err);
      const fallbackResult = fallbackVoiceRouting(transcript);
      res.json(fallbackResult);
    }
  });


  // --- Vite & Production static file delivery ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PROJET PIE] Node.js full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

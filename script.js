/* =============================
   S.G.R. - Escola Manain
   JS RECONSTRUÍDO (LOCALSTORAGE)
   - Salvamento / Atualização
   - Sidebar com busca + exclusão
   - Modal Checklist com textos automáticos
   - Assinaturas (imagens) corrigidas (.png)
   - Espelhamento para impressão (textarea -> div)
================================ */

/* ============ 1) CHECKLIST DB (exemplo; você pode ampliar) ============ */
const CHECKLIST_DB = {
  pedagogica: {
    "1. Cognição e Aprendizagem": [
      { label: "Atenção sustentada", texto: "Demonstra capacidade de manter o foco por períodos curtos a moderados, com mediação.", extra: "Oferecer tarefas segmentadas e pausas planejadas." },
      { label: "Atenção oscilante", texto: "Apresenta variação de foco, necessitando de redirecionamentos frequentes.", extra: "Reduzir distratores e usar sinais combinados para retomada." },
      { label: "Memória de trabalho", texto: "Mostra limitações para reter e manipular informações imediatas durante as tarefas.", extra: "Utilizar pistas visuais, repetição e instruções em etapas." },
      { label: "Compreensão de comandos", texto: "Compreende comandos simples, especialmente quando acompanhados de apoio visual.", extra: "Manter linguagem objetiva e demonstrar antes de solicitar." },
      { label: "Planejamento e organização", texto: "Necessita de apoio para planejar ações e organizar materiais/etapas.", extra: "Usar rotinas visuais, checklist de passos e modelagem." },
      { label: "Flexibilidade cognitiva", texto: "Apresenta rigidez em mudanças de rotina e transições.", extra: "Antecipar mudanças e oferecer escolhas limitadas." },
      { label: "Resolução de problemas", texto: "Dificulta-se em resolver situações novas sem ajuda direta.", extra: "Treinar tentativa/erro guiado e perguntas de mediação." },
      { label: "Generalização", texto: "Tem dificuldade em transferir aprendizados para contextos diferentes.", extra: "Variar contextos e repetir objetivos em ambientes diversos." },
      { label: "Ritmo de aprendizagem", texto: "Necessita de maior tempo para aquisição e consolidação de habilidades.", extra: "Reforçar com revisão frequente e prática espaçada." },
      { label: "Persistência", texto: "Pode interromper a tarefa diante de frustração ou dificuldade.", extra: "Reforço positivo, metas curtas e apoio emocional." },
      { label: "Iniciativa", texto: "A iniciativa é reduzida, aguardando direcionamentos para começar.", extra: "Usar prompts graduais e incentivar escolhas." },
      { label: "Autorregulação", texto: "Apresenta dificuldade para regular emoções durante exigências.", extra: "Estratégias de respiração, cantinho de regulação e combinados." },
      { label: "Resposta a feedback", texto: "Responde melhor a feedback imediato e concreto.", extra: "Dar retorno curto, específico e imediatamente após a ação." },
      { label: "Atenção compartilhada", texto: "A atenção compartilhada ocorre com apoio e estímulo do adulto.", extra: "Atividades de turnos e apontamento guiado." },
      { label: "Engajamento", texto: "Engaja-se mais quando a atividade é significativa e lúdica.", extra: "Usar interesses do estudante e gamificação." },
      { label: "Percepção visual", texto: "Demonstra necessidade de apoio para discriminação visual em detalhes.", extra: "Usar contrastes, ampliar fonte e pareamento." },
      { label: "Percepção auditiva", texto: "Pode ter dificuldade em discriminar falas em ambiente ruidoso.", extra: "Ambiente mais silencioso e instruções próximas." },
      { label: "Sequenciação", texto: "Apresenta dificuldade em seguir sequências de ações.", extra: "Rotinas com imagens numeradas e repetição guiada." },
      { label: "Lateralidade/espacial", texto: "Pode confundir direita/esquerda e relações espaciais.", extra: "Atividades corporais e jogos de localização no espaço." },
      { label: "Tempo e rotina", texto: "Necessita de referência para noções de tempo (antes/depois).", extra: "Calendário visual e contagem regressiva de transições." }
    ],
    "2. Comunicação e Linguagem": [
      { label: "Comunicação não verbal", texto: "Utiliza gestos/expressões para comunicar necessidades de forma parcial.", extra: "Ampliar repertório com CAA e pistas visuais." },
      { label: "Comunicação verbal", texto: "Apresenta linguagem oral funcional em situações conhecidas.", extra: "Expandir vocabulário e treinar perguntas/respostas." },
      { label: "Ausência de fala funcional", texto: "Não utiliza fala funcional como principal meio de comunicação.", extra: "Implantar/fortalecer CAA com apoio multiprofissional." },
      { label: "Ecolalia", texto: "Apresenta repetição de falas (ecolalia) em alguns contextos.", extra: "Modelar respostas funcionais e ampliar intenção comunicativa." },
      { label: "Compreensão verbal", texto: "Compreende melhor instruções curtas e concretas.", extra: "Evitar metáforas; usar frases simples e exemplos." },
      { label: "Nomeação", texto: "Nomeia objetos/pessoas com apoio e em contextos familiares.", extra: "Jogos de nomeação com imagens reais e generalização." },
      { label: "Pragmática", texto: "Necessita de apoio para iniciar, manter e encerrar interações.", extra: "Treino de turnos, scripts sociais e rodas mediadas." },
      { label: "Atenção conjunta", texto: "A atenção conjunta ocorre com apoio e mediação do adulto.", extra: "Atividades de turnos e apontamento guiado." },
      { label: "Imitação", texto: "Imita ações simples com mediação.", extra: "Modelagem, espelhamento e reforço imediato." },
      { label: "Turnos de fala", texto: "Dificulta-se em aguardar sua vez.", extra: "Jogos de turnos com regras claras e temporizador." },
      { label: "Expressão emocional", texto: "Demonstra emoções, porém pode ter dificuldade em nomeá-las.", extra: "Cartões de emoções e rotinas de identificação." },
      { label: "Vocabulário restrito", texto: "Vocabulário é restrito a temas de interesse e rotinas.", extra: "Ampliar por categorias (objetos, lugares, ações)." },
      { label: "Narrativa", texto: "Dificuldade em relatar eventos com sequência e detalhes.", extra: "Sequência de imagens e perguntas guiadas." },
      { label: "Consciência fonológica", texto: "Necessita de apoio para rimas e sons iniciais.", extra: "Jogos de rimas, aliteração e segmentação oral." },
      { label: "Leitura de imagens", texto: "Compreende imagens/pictogramas com bom desempenho.", extra: "Usar suportes visuais na rotina e instruções." },
      { label: "Compreensão de histórias", texto: "Acompanha histórias curtas com apoio visual.", extra: "Leitura compartilhada e perguntas de compreensão." },
      { label: "Interação com pares", texto: "Interage com pares de forma pontual, com mediação.", extra: "Atividades cooperativas estruturadas e pareamento." },
      { label: "Solicitação de ajuda", texto: "Nem sempre solicita ajuda espontaneamente.", extra: "Ensinar sinais/expressões para pedir ajuda." },
      { label: "Resposta a perguntas", texto: "Responde melhor a perguntas fechadas e com opções.", extra: "Oferecer escolhas visuais e perguntas objetivas." },
      { label: "Comunicação funcional", texto: "Comunica necessidades básicas com pistas e rotina.", extra: "Rotinas de comunicação diária e reforço de iniciativa." }
    ],
    "3. Habilidades Acadêmicas": [
      { label: "Pré-leitura", texto: "Reconhece símbolos/figuras e inicia associação imagem-palavra.", extra: "Pareamento imagem-palavra e rótulos no ambiente." },
      { label: "Reconhecimento de letras", texto: "Identifica algumas letras do próprio nome/alfabeto.", extra: "Jogos de letras e atividades multissensoriais." },
      { label: "Escrita do nome", texto: "Registra o próprio nome com apoio e modelo.", extra: "Traçado guiado e prática diária." },
      { label: "Hipótese de escrita", texto: "Apresenta hipóteses iniciais de escrita, com registros não convencionais.", extra: "Consciência fonológica e escrita espontânea mediada." },
      { label: "Leitura global", texto: "Reconhece palavras familiares de forma global.", extra: "Cartões de palavras funcionais e leitura no cotidiano." },
      { label: "Compreensão leitora", texto: "Compreende textos curtos com mediação.", extra: "Perguntas simples e retomadas com imagens." },
      { label: "Motricidade fina", texto: "Necessita de apoio para preensão e controle do lápis.", extra: "Pinças, massinha, traçados e recorte." },
      { label: "Cópia", texto: "Copia com variação de alinhamento e tamanho.", extra: "Folhas pautadas ampliadas e modelo destacado." },
      { label: "Coordenação visomotora", texto: "Dificuldade em coordenação visomotora para escrita/desenho.", extra: "Labirintos, pontilhados e coordenação olho-mão." },
      { label: "Noção de número", texto: "Reconhece numerais em sequência limitada.", extra: "Bingo numérico e pareamento numeral-quantidade." },
      { label: "Contagem", texto: "Realiza contagem verbal com correspondência variável.", extra: "Contagem com objetos e marcação visual." },
      { label: "Comparação de quantidades", texto: "Dificulta-se em comparar mais/menos/igual.", extra: "Jogos de comparação com material concreto." },
      { label: "Classificação", texto: "Classifica por cor/forma com apoio.", extra: "Atividades por categorias e agrupamentos." },
      { label: "Seriação", texto: "Organiza sequências simples com ajuda.", extra: "Seriação com blocos, figuras e objetos." },
      { label: "Medidas", texto: "Inicia compreensão de medidas em situações práticas.", extra: "Receitas e medir com utensílios." },
      { label: "Rotina/tempo", texto: "Reconhece momentos da rotina com apoio visual.", extra: "Quadro de rotina e calendário." },
      { label: "Autonomia acadêmica", texto: "Necessita de ajuda para iniciar/finalizar atividades.", extra: "Prompts graduais e metas pequenas." },
      { label: "Participação em grupo", texto: "Participa de atividades coletivas com mediação.", extra: "Combinados visuais e organização do espaço." },
      { label: "Uso de tecnologia", texto: "Responde bem a recursos digitais como suporte.", extra: "Apps educativos e recursos de acessibilidade." },
      { label: "Avaliação adaptada", texto: "Necessita de adequações de acesso e resposta.", extra: "Tempo ampliado, mediação e formatos alternativos." }
    ]
  },

  clinica: {
    "1. Desenvolvimento e Saúde": [
      { label: "Histórico de desenvolvimento", texto: "Há relato de atraso e/ou diferenças no desenvolvimento neuropsicomotor.", extra: "Manter acompanhamento clínico especializado conforme necessidade." },
      { label: "Sono", texto: "Apresenta alterações de sono que impactam disposição e atenção.", extra: "Orientar higiene do sono e alinhar com a família." },
      { label: "Alimentação", texto: "Demonstra seletividade alimentar e/ou dificuldades na aceitação.", extra: "Estratégias graduais e acompanhamento multiprofissional." },
      { label: "Audição", texto: "Há necessidade de monitoramento auditivo.", extra: "Encaminhar para avaliação audiológica quando indicado." },
      { label: "Visão", texto: "Há necessidade de monitoramento visual.", extra: "Encaminhar para avaliação oftalmológica quando indicado." },
      { label: "Convulsões", texto: "Há relato de crises convulsivas controladas/em investigação.", extra: "Plano de segurança e acompanhamento neurológico." },
      { label: "Medicação", texto: "Pode fazer uso de medicação com impacto em alerta/atenção.", extra: "Registrar efeitos observados e comunicar responsáveis." },
      { label: "Alergias", texto: "Há relatos de alergias que exigem cuidados.", extra: "Plano de cuidados e comunicação com a equipe." },
      { label: "Comorbidades", texto: "Há indícios de condições associadas que impactam aprendizagem.", extra: "Acompanhamento interdisciplinar e registro sistemático." },
      { label: "Regulação emocional", texto: "Variações de humor e reações intensas a frustrações.", extra: "Rotina previsível e estratégias de regulação." },
      { label: "Sensibilidade sonora", texto: "Reage a ruídos com desconforto ou fuga.", extra: "Reduzir ruídos e considerar protetor auricular." },
      { label: "Sensibilidade tátil", texto: "Desconforto com toque/texturas em algumas situações.", extra: "Respeitar limites e oferecer adaptação sensorial." },
      { label: "Sensibilidade visual", texto: "Incomoda-se com luz forte/excesso de estímulos visuais.", extra: "Iluminação indireta e organização visual." },
      { label: "Comunicação de dor", texto: "Nem sempre comunica dor com clareza.", extra: "Observar sinais, registrar e comunicar família." },
      { label: "Saúde bucal", texto: "Necessita de apoio para higiene bucal.", extra: "Orientações e encaminhamento quando necessário." },
      { label: "Controle esfincteriano", texto: "Está em processo de autonomia para uso do banheiro.", extra: "Rotina com reforço e apoio gradual." },
      { label: "Higiene pessoal", texto: "Necessita mediação para higienização.", extra: "Rotinas visuais e treino de autonomia." },
      { label: "Segurança pessoal", texto: "Precisa de apoio para reconhecer riscos.", extra: "Ensino explícito de regras de segurança." },
      { label: "Consultas/rotinas médicas", texto: "Pode demandar consultas e terapias frequentes.", extra: "Articular horários e registrar em plano." },
      { label: "Acompanhamento terapêutico", texto: "Pode se beneficiar de fono/TO/psico/fisio.", extra: "Alinhar objetivos escolares com equipe terapêutica." }
    ],
    "2. Autonomia e Motricidade": [
      { label: "Coordenação grossa", texto: "Dificuldades em corrida, saltos e mudanças de direção.", extra: "Atividades motoras graduais e suporte quando indicado." },
      { label: "Equilíbrio", texto: "Instabilidade em postura estática/dinâmica.", extra: "Circuitos simples e exercícios de equilíbrio." },
      { label: "Coordenação bilateral", texto: "Dificuldade em usar as duas mãos de forma coordenada.", extra: "Atividades bimanual e jogos de encaixe." },
      { label: "Motricidade fina", texto: "Dificuldade em pinça, recorte, encaixe e escrita.", extra: "Atividades lúdicas e apoio de TO se indicado." },
      { label: "Planejamento motor", texto: "Dificuldade em organizar movimentos em sequência.", extra: "Modelagem, pistas visuais e repetição guiada." },
      { label: "Tônus muscular", texto: "Pode apresentar hipotonia/hipertonia.", extra: "Ajustes posturais e orientação especializada." },
      { label: "Postura", texto: "Necessita adequações posturais para ficar sentado.", extra: "Ajuste de mobiliário e apoio postural." },
      { label: "Resistência física", texto: "Fadiga em atividades prolongadas.", extra: "Pausas, alternância de tarefas e hidratação." },
      { label: "Locomoção", texto: "Segurança na locomoção é variável.", extra: "Rotas seguras e supervisão nas transições." },
      { label: "Escadas/desníveis", texto: "Dificuldade em escadas e desníveis.", extra: "Treino supervisionado e uso de corrimão." },
      { label: "Óculo-manual", texto: "Dificulta-se em arremessar/receber objetos.", extra: "Bolas leves, metas próximas e progressão." },
      { label: "Esquema corporal", texto: "Consolida noções do corpo e partes corporais.", extra: "Músicas, espelho e atividades corporais." },
      { label: "Lateralidade", texto: "Lateralidade indefinida/confusão direcional.", extra: "Jogos de direita/esquerda e pistas visuais." },
      { label: "Orientação espacial", texto: "Dificuldade em localizar objetos e seguir trajetos.", extra: "Marcações visuais e rotas simples." },
      { label: "Autonomia alimentar", texto: "Necessita apoio para uso de talheres.", extra: "Treino funcional e utensílios adaptados." },
      { label: "Autonomia no vestir", texto: "Apoio para vestir/abotoar/fechar zíper.", extra: "Treino por etapas e recursos facilitadores." },
      { label: "Organização de materiais", texto: "Dificulta-se em organizar mochila/itens.", extra: "Rotina de organização com imagens." },
      { label: "Acessibilidade", texto: "Responde a adaptações (pranchas, teclado, etc.).", extra: "Manter e revisar recursos de acessibilidade." },
      { label: "Pausas sensoriais", texto: "Pode apresentar cansaço sensorial ao longo do dia.", extra: "Pausas sensoriais e organização de demandas." },
      { label: "Nível de apoio", texto: "Necessita apoio humano e/ou tecnológico para participar.", extra: "Definir apoios e responsabilidades na rotina." }
    ],
    "3. Comportamento e Sensorial": [
      { label: "Fuga/recusa", texto: "Evita demandas quando a tarefa é difícil.", extra: "Ajustar exigência e reforçar tentativa." },
      { label: "Crises", texto: "Desorganização diante de mudanças/sobrecarga.", extra: "Plano de manejo e previsibilidade." },
      { label: "Inquietação", texto: "Necessidade de movimento frequente.", extra: "Pausas ativas e tarefas com movimento." },
      { label: "Impulsividade", texto: "Age sem esperar orientação.", extra: "Regras claras, sinais e reforço por autocontrole." },
      { label: "Reatividade", texto: "Reação intensa a frustrações/limites.", extra: "Estratégias de regulação e análise funcional." },
      { label: "Autoagressão", texto: "Possíveis comportamentos autoagressivos em situações específicas.", extra: "Registro, prevenção e acompanhamento." },
      { label: "Estereotipias", texto: "Movimentos repetitivos em ansiedade/autorregulação.", extra: "Alternativas sensoriais e aceitação quando seguro." },
      { label: "Interesses restritos", texto: "Foco intenso em temas/objetos específicos.", extra: "Usar como motivação e ampliar repertório." },
      { label: "Rigidez", texto: "Resistência a mudanças de rotina.", extra: "Antecipação e transições graduais." },
      { label: "Transições", texto: "Dificuldade em trocar de atividade.", extra: "Avisos prévios, temporizador e escolha." },
      { label: "Hiper/hiporreatividade", texto: "Resposta sensorial aumentada ou reduzida.", extra: "Adaptações ambientais e estratégias sensoriais." },
      { label: "Busca sensorial", texto: "Procura estímulos para organizar-se.", extra: "Cantinho sensorial e objetos reguladores." },
      { label: "Tolerância à frustração", texto: "Tolerância reduzida quando não atinge objetivo.", extra: "Ensinar pedir pausa e reforçar esforço." },
      { label: "Autorregulação emocional", texto: "Precisa de apoio para identificar e regular emoções.", extra: "Rotina de emoções e estratégias combinadas." },
      { label: "Proximidade física", texto: "Reage à aproximação física de colegas/adultos.", extra: "Orientar pares e respeitar limites." },
      { label: "Interação social", texto: "Interação limitada ou atípica.", extra: "Mediação com pares e atividades estruturadas." },
      { label: "Regras e limites", texto: "Necessita ensino explícito de regras.", extra: "Combinados visuais e prática guiada." },
      { label: "Percepção de risco", texto: "Baixa percepção de risco (correr, subir).", extra: "Supervisão e ensino de segurança." },
      { label: "Reforço positivo", texto: "Responde bem a reforçadores e metas curtas.", extra: "Plano de reforço e registro de progresso." },
      { label: "Alinhamento família-escola", texto: "Demanda consistência entre escola e família.", extra: "Reuniões periódicas e comunicação estruturada." }
    ]
  },

  social: {
    "1. Contexto Familiar e Rede": [
      { label: "Composição familiar", texto: "A família tem cuidadores de referência definidos.", extra: "Registrar responsáveis e manter comunicação contínua." },
      { label: "Participação familiar", texto: "Participação nas demandas escolares é variável.", extra: "Fortalecer vínculo e canais de comunicação." },
      { label: "Rede de apoio", texto: "Rede de apoio participa parcialmente.", extra: "Articular rede e encaminhar quando necessário." },
      { label: "Vínculo com a escola", texto: "Vínculo em construção requer acolhimento.", extra: "Ações de acolhimento e escuta ativa." },
      { label: "Rotina domiciliar", texto: "Rotina em casa influencia hábitos e participação escolar.", extra: "Orientações e alinhamento de rotinas com a família." },
      { label: "Cuidador principal", texto: "Há cuidador principal responsável pelas rotinas.", extra: "Mapear disponibilidade e orientar sobre rede de serviços." },
      { label: "Consultas/terapias", texto: "Necessita suporte para consultas/terapias.", extra: "Organizar agenda e orientar sobre transporte/benefícios." },
      { label: "Comunicação família-escola", texto: "Melhor resposta a mensagens objetivas e frequentes.", extra: "Diário de recados e comunicação estruturada." },
      { label: "Histórico escolar", texto: "Histórico com interrupções/trocas de escola.", extra: "Registrar histórico e planejar acolhimento." },
      { label: "Adesão às orientações", texto: "Adesão variável, com necessidade de mediação.", extra: "Reuniões e orientação em linguagem simples." },
      { label: "Dinâmica familiar", texto: "Dinâmica pode impactar frequência/comportamento.", extra: "Acolhimento e encaminhamento quando indicado." },
      { label: "Fatores de risco", texto: "Possíveis fatores de risco social demandam atenção.", extra: "Acionar rede de proteção quando necessário." },
      { label: "Documentação", texto: "Documentos podem estar incompletos.", extra: "Orientar regularização junto aos órgãos." },
      { label: "Transporte", texto: "Necessidade de apoio para deslocamento.", extra: "Articular transporte e rotas seguras." },
      { label: "Acesso à saúde", texto: "Barreiras de acesso a serviços de saúde.", extra: "Encaminhar e apoiar agendamentos." },
      { label: "Acesso a terapias", texto: "Necessita terapias na rede pública/privada.", extra: "Orientar busca e articular serviços." },
      { label: "CRAS/CREAS", texto: "Há vínculo ou necessidade de vínculo com CRAS/CREAS.", extra: "Encaminhar e acompanhar com a rede." },
      { label: "Conselho Tutelar", texto: "Pode demandar interface com rede de proteção.", extra: "Seguir fluxos institucionais e registrar." },
      { label: "Intersetorialidade", texto: "Necessita articulação educação-saúde-assistência.", extra: "Plano integrado de acompanhamento." },
      { label: "Acompanhamento social", texto: "Demanda acompanhamento social sistemático.", extra: "Definir periodicidade e registrar atendimentos." }
    ],
    "2. Condições Socioeconômicas": [
      { label: "Renda familiar", texto: "Renda limitada impacta acesso a recursos.", extra: "Orientar programas e benefícios sociais." },
      { label: "Trabalho/emprego", texto: "Situação laboral pode ser instável.", extra: "Encaminhar a serviços socioassistenciais quando aplicável." },
      { label: "Moradia", texto: "Condições de moradia podem demandar atenção.", extra: "Articular rede e orientar conforme necessidade." },
      { label: "Segurança alimentar", texto: "Pode haver insegurança alimentar em períodos do mês.", extra: "Encaminhar rede e políticas públicas." },
      { label: "Gastos com saúde", texto: "Gastos elevados com saúde/terapias.", extra: "Orientar benefícios e isenções quando cabíveis." },
      { label: "Internet/dispositivos", texto: "Acesso a internet/dispositivos pode ser limitado.", extra: "Alternativas offline e apoio institucional." },
      { label: "Material escolar", texto: "Dificuldade para aquisição de materiais.", extra: "Articular apoio institucional/programas." },
      { label: "Sobrecarga do cuidador", texto: "Rotina de cuidado intensivo pode sobrecarregar.", extra: "Acolhimento e orientação sobre suporte ao cuidador." },
      { label: "Vulnerabilidade", texto: "Vulnerabilidade socioeconômica identificada.", extra: "Acompanhamento e encaminhamentos conforme avaliação." },
      { label: "Endividamento", texto: "Endividamento pode comprometer orçamento.", extra: "Orientação e encaminhamento socioassistencial." },
      { label: "Benefícios eventuais", texto: "Pode necessitar de benefícios eventuais.", extra: "Encaminhar conforme critérios da rede." },
      { label: "Mudanças frequentes", texto: "Mudanças de endereço impactam continuidade escolar.", extra: "Registrar e orientar para permanência." },
      { label: "Lazer/cultura", texto: "Acesso a lazer e cultura pode ser restrito.", extra: "Sugerir atividades comunitárias gratuitas." },
      { label: "Apoio comunitário", texto: "Apoio comunitário (ONG/igreja) pode contribuir.", extra: "Mapear e articular quando pertinente." },
      { label: "Território de risco", texto: "O território pode apresentar riscos.", extra: "Orientar cuidados e articular rede." },
      { label: "Transporte público", texto: "Dificuldades com transporte público impactam frequência.", extra: "Avaliar necessidade de transporte escolar." },
      { label: "Horários do cuidador", texto: "Cuidador pode ter horários restritos.", extra: "Flexibilizar comunicação e orientar apoio." },
      { label: "Documentos para benefícios", texto: "Falta de documentos limita acesso a benefícios.", extra: "Orientar documentação e regularização." },
      { label: "Barreiras financeiras", texto: "Barreiras financeiras afetam participação escolar.", extra: "Adequar propostas e reduzir custos." },
      { label: "Suporte contínuo", texto: "Necessita suporte social contínuo para estabilidade.", extra: "Plano de acompanhamento com metas." }
    ],
    "3. Acesso a Direitos e Serviços": [
      { label: "BPC/LOAS", texto: "Possui ou pode se enquadrar para BPC/LOAS.", extra: "Orientar requerimento e CadÚnico." },
      { label: "CadÚnico", texto: "Cadastro pode estar desatualizado.", extra: "Orientar atualização junto ao CRAS." },
      { label: "Passe livre", texto: "Pode se beneficiar de passe livre/benefícios de transporte.", extra: "Orientar solicitação conforme regras locais." },
      { label: "Carteira PcD", texto: "Pode necessitar identificação PcD para acesso a direitos.", extra: "Orientar emissão conforme município/estado." },
      { label: "Isenções", texto: "Pode ter direito a isenções conforme critérios.", extra: "Orientar busca com assistência social." },
      { label: "Direitos educacionais", texto: "Necessita garantia de acessibilidade e apoios na escola.", extra: "Registrar adequações e orientar família." },
      { label: "Orientação jurídica", texto: "Pode necessitar orientação jurídica em demandas específicas.", extra: "Encaminhar para defensoria/serviços." },
      { label: "Rede de proteção", texto: "Necessita interface com rede de proteção, quando aplicável.", extra: "Seguir fluxos institucionais e registrar." },
      { label: "Saúde mental", texto: "Pode necessitar CAPS/serviços especializados.", extra: "Encaminhar conforme rede de saúde." },
      { label: "Reabilitação", texto: "Pode se beneficiar de serviços de reabilitação.", extra: "Orientar e articular encaminhamento." },
      { label: "Atualização documental", texto: "Pode precisar atualizar documentos clínicos periodicamente.", extra: "Orientar família sobre prazos e serviços." },
      { label: "Acessibilidade", texto: "Acessibilidade pode demandar adaptações.", extra: "Orientar e buscar recursos com a rede." },
      { label: "Programas educacionais", texto: "Pode acessar programas/auxílios educacionais.", extra: "Orientar conforme políticas vigentes." },
      { label: "Normativas PR", texto: "Demandas devem observar normativas do Paraná.", extra: "Atuar conforme orientações vigentes (CEE/PR e SEED/PR)." },
      { label: "Devolutivas de terapias", texto: "Necessita devolutivas de terapias para alinhar ações.", extra: "Solicitar devolutivas e alinhar objetivos." },
      { label: "Acompanhamento periódico", texto: "Necessita reavaliação e acompanhamento social periódico.", extra: "Definir cronograma e registrar evolução." },
      { label: "Plano intersetorial", texto: "Beneficia-se de plano intersetorial de acompanhamento.", extra: "Reuniões com saúde/assistência/educação." },
      { label: "Garantia de direitos", texto: "Família precisa de suporte para garantia de direitos sociais.", extra: "Orientação contínua e encaminhamentos documentados." },
      { label: "Encaminhamentos formais", texto: "Encaminhamentos devem ser documentados e monitorados.", extra: "Registrar, acompanhar prazos e retornos." },
      { label: "Fortalecimento de vínculo", texto: "Fortalecer vínculo e autonomia familiar para sustentação do plano.", extra: "Ações educativas e acompanhamento contínuo." }
    ]
  }
};

/* ============ 2) ASSINATURAS (ARQUIVOS CORRIGIDOS) ============ */
const DB_ASSINATURAS = {
  pedagoga: [
    { nome: "Jhenifer Cavalheiro André", arquivo: "asspedagoda.png", cargo: "Pedagoga" },
    { nome: "Isabella Floripes Sanches", arquivo: "asspedagoda2.png", cargo: "Pedagoga" },
    { nome: "--- Sem Assinatura ---", arquivo: "", cargo: "Pedagoga" }
  ],
  psicologa: [
    { nome: "Jaqueline Gonçalves Malaquim", arquivo: "asspsicologa.png", cargo: "Psicóloga" },
    { nome: "--- Sem Assinatura ---", arquivo: "", cargo: "Psicóloga" }
  ],
  social: [
    { nome: "Andréa Cristina Santos", arquivo: "asssocial.png", cargo: "Assistente Social" },
    { nome: "--- Sem Assinatura ---", arquivo: "", cargo: "Assistente Social" }
  ]
};

/* ============ 3) ESTADO GLOBAL ============ */
const STORAGE_KEY = "db_escola_manain_v3";
let modalAtual = "";
let bancoRelatorios = [];

/** Estrutura de dados por área (texto + extra) */
let dadosRelatorio = {
  pedagogica: { texto: "", extra: "" },
  clinica: { texto: "", extra: "" },
  social: { texto: "", extra: "" }
};

/** Identificação bloqueada após carregar relatório salvo */
let identificacaoTravada = false;

const OBSERVACAO_PADRAO = "Esta avaliação foi realizada em conformidade com a legislação vigente e com as normativas que regulamentam a Educação Especial e a Educação Inclusiva no âmbito nacional e no Estado do Paraná, assegurando os princípios de acessibilidade, equidade, atendimento às necessidades educacionais específicas e garantia de direitos do estudante. Foram observadas diretrizes legais como a Constituição Federal, a LDB (Lei nº 9.394/1996), o ECA (Lei nº 8.069/1990), a Lei Brasileira de Inclusão (Lei nº 13.146/2015), o Decreto nº 7.611/2011 e demais orientações educacionais aplicáveis, bem como as normativas estaduais vigentes (CEE/PR e SEED/PR).";
function aplicarObservacaoPadrao(force=false) {
  const obs = document.getElementById("final-observacoes");
  if (!obs) return;
  const atual = (obs.value || "").trim();
  if (force || !atual) {
    obs.value = OBSERVACAO_PADRAO;
    if (obs.mirrorDiv) obs.mirrorDiv.innerText = obs.value;
    ajustarAltura(obs);
  }
}

/* ============ 4) INICIALIZAÇÃO ============ */
document.addEventListener("DOMContentLoaded", () => {
  configurarEspelhoTextareas();
  carregarBancoDeDados();
  inicializarAssinaturas();
  prepararDatas();
  vincularEventos();
  aplicarObservacaoPadrao();

  // Se não existe ID, inicia como novo relatório
  if (!document.getElementById("reportId").value) {
    novoRelatorio(false);
  }
});

function prepararDatas() {
  const hoje = new Date();
  const el = document.getElementById("dataAtual");
  if (el) el.textContent = hoje.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

/* ============ 5) SIDEBAR ============ */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("aberto");
}

function filtrarLista() {
  atualizarListaSidebar();
}

/* ============ 6) BANCO (LOCALSTORAGE) ============ */
function carregarBancoDeDados() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) {
    bancoRelatorios = [];
    atualizarListaSidebar();
    return;
  }

  try {
    bancoRelatorios = JSON.parse(json) || [];
  } catch (e) {
    console.error("Erro ao ler banco:", e);
    bancoRelatorios = [];
  }

  atualizarListaSidebar();
}

function persistirBanco() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bancoRelatorios));
}

function salvarNoBanco() {
  const nome = (document.getElementById("nomeEstudante").value || "").trim();
  if (!nome) {
    alert("⚠️ Digite o NOME DO ESTUDANTE antes de salvar.");
    return;
  }

  // Coleta inputs/areas (exceto busca)
  const inputs = coletarInputs();

  // Salva seleção de assinaturas
  inputs.sel_pedagoga = document.getElementById("sel_pedagoga").value;
  inputs.sel_psicologa = document.getElementById("sel_psicologa").value;
  inputs.sel_social = document.getElementById("sel_social").value;

  const idAtual = document.getElementById("reportId").value || Date.now().toString();

  const relatorioObjeto = {
    id: idAtual,
    nome,
    dataSalvo: new Date().toLocaleString("pt-BR"),
    inputs,
    dadosRelatorio
  };

  const idx = bancoRelatorios.findIndex(r => r.id === idAtual);
  if (idx >= 0) bancoRelatorios[idx] = relatorioObjeto;
  else bancoRelatorios.push(relatorioObjeto);

  document.getElementById("reportId").value = idAtual;

  persistirBanco();
  atualizarListaSidebar();

  // feedback no botão
  feedbackBotaoSalvar();

  // após salvar, travar identificação (conforme pedido)
  travarIdentificacao(true);
}

function coletarInputs() {
  const inputs = {};
  document.querySelectorAll("input, textarea").forEach(el => {
    if (!el.id) return;
    if (el.id === "buscaAluno") return;
    inputs[el.id] = el.value;
  });
  return inputs;
}

function feedbackBotaoSalvar() {
  const btn = document.getElementById("btnSalvar");
  if (!btn) return;
  const original = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check"></i> SALVO!';
  setTimeout(() => (btn.innerHTML = original), 1400);
}

function atualizarListaSidebar() {
  const lista = document.getElementById("lista-alunos");
  const termo = (document.getElementById("buscaAluno").value || "").toLowerCase();

  lista.innerHTML = "";
  const ordenado = [...bancoRelatorios].sort((a, b) => Number(b.id) - Number(a.id));

  ordenado.forEach(rel => {
    if (!rel.nome.toLowerCase().includes(termo)) return;

    const div = document.createElement("div");
    div.className = "item-aluno";
    div.setAttribute("role", "listitem");
    div.innerHTML = `
      <h4>${escapeHtml(rel.nome)}</h4>
      <span><i class="far fa-clock"></i> ${escapeHtml(rel.dataSalvo || "")}</span>
      <button type="button" class="btn-apagar-item" title="Excluir" aria-label="Excluir">
        <i class="fas fa-trash"></i>
      </button>
    `;

    // abrir
    div.addEventListener("click", (e) => {
      if (e.target.closest(".btn-apagar-item")) return;
      carregarRelatorio(rel.id);
    });

    // excluir
    div.querySelector(".btn-apagar-item").addEventListener("click", (e) => {
      e.stopPropagation();
      deletarRelatorio(rel.id);
    });

    lista.appendChild(div);
  });
}

function carregarRelatorio(id) {
  const rel = bancoRelatorios.find(r => r.id === id);
  if (!rel) return;

  if (!confirm(`Deseja abrir o relatório de "${rel.nome}"?\nDados não salvos na tela atual serão perdidos.`)) return;

  // Preenche campos
  if (rel.inputs) {
    for (const [key, value] of Object.entries(rel.inputs)) {
      const el = document.getElementById(key);
      if (!el) continue;

      el.value = value ?? "";

      // atualização do espelho de impressão
      if (el.tagName === "TEXTAREA" && el.mirrorDiv) {
        el.mirrorDiv.innerText = el.value;
        ajustarAltura(el);
      }

      // se for select assinatura, disparar change para atualizar imagem/cargo
      if (key.startsWith("sel_")) {
        el.dispatchEvent(new Event("change"));
      }
    }
  }

  // estado dos checklists
  if (rel.dadosRelatorio) dadosRelatorio = rel.dadosRelatorio;

  document.getElementById("reportId").value = rel.id;

  atualizarStatusVisual("pedagogica");
  atualizarStatusVisual("clinica");
  atualizarStatusVisual("social");

  calcularIdade();
  atualizarFinais();
  aplicarObservacaoPadrao();

  // travar identificação ao carregar (pode destravar pelo botão)
  travarIdentificacao(true);

  // fecha sidebar (se estiver aberta)
  if (document.getElementById("sidebar").classList.contains("aberto")) toggleSidebar();
}

function deletarRelatorio(id) {
  if (!confirm("ATENÇÃO: Deseja EXCLUIR PERMANENTEMENTE este relatório?")) return;

  bancoRelatorios = bancoRelatorios.filter(r => r.id !== id);
  persistirBanco();
  atualizarListaSidebar();

  if (document.getElementById("reportId").value === id) {
    novoRelatorio(false);
  }
}

function novoRelatorio(perguntar = true) {
  if (perguntar && !confirm("Deseja limpar a tela para iniciar um NOVO aluno?")) return;

  // limpa inputs/textarea (exceto fixos)
  document.querySelectorAll("input, textarea").forEach(el => {
    if (!el.id) return;
    if (["nre", "municipio", "escola", "buscaAluno"].includes(el.id)) return;
    el.value = "";
    if (el.mirrorDiv) el.mirrorDiv.innerText = "";
    if (el.tagName === "TEXTAREA") ajustarAltura(el);
  });

  // reseta selects
  ["pedagoga", "psicologa", "social"].forEach(tipo => {
    const sel = document.getElementById(`sel_${tipo}`);
    if (sel) {
      sel.value = 0;
      sel.dispatchEvent(new Event("change"));
    }
  });

  // reseta dados
  dadosRelatorio = {
    pedagogica: { texto: "", extra: "" },
    clinica: { texto: "", extra: "" },
    social: { texto: "", extra: "" }
  };

  document.getElementById("reportId").value = "";

  atualizarStatusVisual("pedagogica");
  atualizarStatusVisual("clinica");
  atualizarStatusVisual("social");

  // identificação livre no novo
  travarIdentificacao(false);
}

/* ============ 7) TRAVAR / DESTRAVAR IDENTIFICAÇÃO ============ */
function travarIdentificacao(travar) {
  identificacaoTravada = !!travar;
  const ids = ["nomeEstudante", "dataNascimento", "filiacao", "dataAvaliacao"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.readOnly = identificacaoTravada;
    el.disabled = identificacaoTravada && el.type === "date"; // date não respeita bem readonly
  });
}

function desbloquearIdentificacao() {
  if (!document.getElementById("reportId").value) {
    travarIdentificacao(false);
    return;
  }
  if (!confirm("Deseja habilitar edição da IDENTIFICAÇÃO deste relatório?")) return;
  travarIdentificacao(false);
}

/* ============ 8) ASSINATURAS ============ */
function inicializarAssinaturas() {
  ["pedagoga", "psicologa", "social"].forEach(tipo => {
    const select = document.getElementById(`sel_${tipo}`);
    const lista = DB_ASSINATURAS[tipo];

    if (!select || !lista) return;

    select.innerHTML = "";
    lista.forEach((prof, idx) => {
      const option = document.createElement("option");
      option.value = String(idx);
      option.textContent = prof.nome;
      select.appendChild(option);
    });

    // Atualiza imagem/cargo
    mudarAssinatura(tipo);
  });
}

function mudarAssinatura(tipo) {
  const select = document.getElementById(`sel_${tipo}`);
  const img = document.getElementById(`img_${tipo}`);
  const cargo = document.getElementById(`cargo_${tipo}`);

  if (!select || !img || !cargo) return;

  const dados = DB_ASSINATURAS[tipo][Number(select.value)];

  if (dados?.arquivo) {
    img.src = dados.arquivo;
    img.style.display = "block";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
  }

  cargo.textContent = dados?.cargo || cargo.textContent || "";
}

/* ============ 9) ESPAÇAMENTO / ESPELHO PARA IMPRESSÃO ============ */
function configurarEspelhoTextareas() {
  document.querySelectorAll("textarea").forEach(tx => {
    const mirror = document.createElement("div");
    mirror.className = "print-mirror";
    tx.parentNode.insertBefore(mirror, tx.nextSibling);
    tx.mirrorDiv = mirror;

    const sync = () => {
      mirror.innerText = tx.value || "";
      ajustarAltura(tx);
    };

    tx.addEventListener("input", sync);
    sync();
  });
}

function ajustarAltura(el) {
  // Ajuste de altura para visualização na tela (não interfere no print, que usa o mirror)
  if (!el) return;
  el.style.height = "auto";
  el.style.height = (el.scrollHeight + 2) + "px";
}

/* ============ 10) IDADE ============ */
function vincularEventos() {
  const nasc = document.getElementById("dataNascimento");
  if (nasc) nasc.addEventListener("change", calcularIdade);
}

function calcularIdade() {
  const nasc = document.getElementById("dataNascimento").value;
  if (!nasc) return;

  const hoje = new Date();
  const n = new Date(nasc);

  let idade = hoje.getFullYear() - n.getFullYear();
  const aniversarioEsteAno = new Date(hoje.getFullYear(), n.getMonth(), n.getDate());
  if (hoje < aniversarioEsteAno) idade--;

  document.getElementById("idade").value = `${idade} anos`;
}

/* ============ 11) STATUS VISUAL ============ */
function atualizarStatusVisual(tipo) {
  const st = document.getElementById(`status-${tipo}`);
  if (!st) return;

  const temTexto = (dadosRelatorio[tipo]?.texto || "").trim().length > 0;

  if (temTexto) {
    st.innerHTML = `<i class="fas fa-check-circle"></i> OK`;
    st.className = "status salvo";
  } else {
    st.textContent = "Pendente";
    st.className = "status pendente";
  }
}

/* ============ 12) MODAL CHECKLIST ============ */
function abrirModal(tipo) {
  modalAtual = tipo;

  const overlay = document.getElementById("modalOverlay");
  const container = document.getElementById("container-checklist");
  const labelExtra = document.getElementById("labelExtra");
  const titulo = document.getElementById("modalTitulo");

  if (!overlay || !container || !labelExtra || !titulo) return;

  titulo.textContent = "Checklist: " + tipo.charAt(0).toUpperCase() + tipo.slice(1);

  labelExtra.textContent = (tipo === "pedagogica")
    ? "2. Indicações (Automático):"
    : "2. Encaminhamentos (Automático):";

  document.getElementById("modalTexto").value = dadosRelatorio[tipo]?.texto || "";
  document.getElementById("modalExtra").value = dadosRelatorio[tipo]?.extra || "";

  container.innerHTML = "";

  const db = CHECKLIST_DB[tipo];
  if (db) {
    for (const [categoria, itens] of Object.entries(db)) {
      const grupo = document.createElement("div");
      grupo.className = "grupo-checklist";
      grupo.innerHTML = `<h5>${escapeHtml(categoria)}</h5>`;

      itens.forEach(item => {
        const checked = (document.getElementById("modalTexto").value || "").includes(item.texto);

        const linha = document.createElement("div");
        linha.className = "item-check";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = checked;
        input.addEventListener("change", () => procCheck(input.checked, item.texto, item.extra || ""));

        const lab = document.createElement("label");
        lab.textContent = item.label;

        linha.appendChild(input);
        linha.appendChild(lab);
        grupo.appendChild(linha);
      });

      container.appendChild(grupo);
    }
  }

  overlay.style.display = "flex";
  overlay.setAttribute("aria-hidden", "false");
}

function procCheck(checked, texto, extra) {
  const t = document.getElementById("modalTexto");
  const e = document.getElementById("modalExtra");
  if (!t || !e) return;

  const linhasT = (t.value || "").split("\n").map(s => s.trim()).filter(Boolean);
  const linhasE = (e.value || "").split("\n").map(s => s.trim()).filter(Boolean);

  if (checked) {
    if (!linhasT.includes(texto)) linhasT.push(texto);
    if (extra && !linhasE.includes(`- ${extra}`) && !linhasE.includes(extra)) linhasE.push(`- ${extra}`);
  } else {
    const idxT = linhasT.indexOf(texto);
    if (idxT >= 0) linhasT.splice(idxT, 1);

    if (extra) {
      const idxE1 = linhasE.indexOf(`- ${extra}`);
      const idxE2 = linhasE.indexOf(extra);
      const idxE = idxE1 >= 0 ? idxE1 : idxE2;
      if (idxE >= 0) linhasE.splice(idxE, 1);
    }
  }

  t.value = linhasT.join("\n");
  e.value = linhasE.join("\n");
}

function salvarModal() {
  if (!modalAtual) return;

  dadosRelatorio[modalAtual] = {
    texto: document.getElementById("modalTexto").value || "",
    extra: document.getElementById("modalExtra").value || ""
  };

  // mantém espelho do textarea oculto (para impressão)
  const hidden = document.getElementById(`texto-${modalAtual}`);
  if (hidden) {
    hidden.value = dadosRelatorio[modalAtual].texto;
    if (hidden.mirrorDiv) hidden.mirrorDiv.innerText = hidden.value;
  }

  atualizarStatusVisual(modalAtual);
  atualizarFinais();
  fecharModal();
}

function fecharModal() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden", "true");
}

/* ============ 13) FINAIS AUTOMÁTICOS ============ */
function atualizarFinais() {
  // Indicações (prioriza extra pedagógico quando o campo estiver vazio ou igual ao último automático)
  const ind = document.getElementById("final-indicacoes");
  if (ind) {
    const auto = (dadosRelatorio.pedagogica.extra || "").trim();
    if (auto && (!ind.value.trim() || ind.value.trim() === auto)) {
      ind.value = auto;
      if (ind.mirrorDiv) ind.mirrorDiv.innerText = ind.value;
      ajustarAltura(ind);
    }
  }

  // Encaminhamentos (compõe clinica + social quando estiver vazio)
  const finEnc = document.getElementById("final-encaminhamentos");
  if (finEnc) {
    let enc = "";
    const c = (dadosRelatorio.clinica.extra || "").trim();
    const s = (dadosRelatorio.social.extra || "").trim();
    if (c) enc += "SAÚDE:\n" + c + "\n\n";
    if (s) enc += "SOCIAL:\n" + s;

    if (enc.trim() && !finEnc.value.trim()) {
      finEnc.value = enc.trim();
      if (finEnc.mirrorDiv) finEnc.mirrorDiv.innerText = finEnc.value;
      ajustarAltura(finEnc);
    }
  }
}

function gerarConclusaoAutomatica() {
  const nome = (document.getElementById("nomeEstudante").value || "").trim() || "O estudante";
  const conc = document.getElementById("final-conclusao");
  if (!conc) return;

  if (conc.value.trim() && !confirm("O campo de conclusão já possui texto. Deseja sobrescrever?")) return;

  const ped = (dadosRelatorio.pedagogica.texto || "").replace(/\n/g, " ");
  const cli = (dadosRelatorio.clinica.texto || "").replace(/\n/g, " ");
  const soc = (dadosRelatorio.social.texto || "").replace(/\n/g, " ");

  conc.value =
`Considerando o processo avaliativo realizado, conclui-se que ${nome} apresenta necessidades educacionais específicas que requerem apoio sistemático e intervenções planejadas no contexto escolar.

Síntese pedagógica: ${ped || "Foram observadas características relevantes para organização de estratégias pedagógicas individualizadas."}

Síntese clínica: ${cli || "Foram consideradas informações sobre saúde, autonomia e aspectos do desenvolvimento."}

Síntese social: ${soc || "Foram levantadas informações sobre contexto familiar e rede de apoio."}

Recomenda-se continuidade do acompanhamento interdisciplinar, com adequações pedagógicas, suporte à comunicação e organização de rotinas, visando participação, aprendizagem e desenvolvimento integral.`;

  if (conc.mirrorDiv) conc.mirrorDiv.innerText = conc.value;
  ajustarAltura(conc);
}

/* ============ 14) SEGURANÇA (escape) ============ */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

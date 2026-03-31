import { useState, useEffect, useRef } from 'react'
import { dddToCity } from './data/ddd'
import { supabase } from './lib/supabase'

const delay = ms => new Promise(r => setTimeout(r, ms))

const TOTAL_STEPS = 13

const SEGMENTS = [
  'Agência', 'Agronegócio', 'Alimentação e bebidas', 'Automotivo',
  'Beleza e estética', 'Construção e engenharia', 'Consultoria', 'CRM',
  'E-commerce', 'Educação', 'Emissora Rádio/Tv', 'Energia Solar',
  'Esportes e fitness', 'Eventos', 'Finanças', 'Imobiliário',
  'Incorporação', 'Indústria', 'Jurídico', 'Logística e transporte',
  'Moda e vestuário', 'Recursos humanos', 'Saúde', 'Seguradora',
  'Serviço', 'Tecnologia', 'Telecomunicação', 'Turismo', 'Varejo', 'Outro',
]

const ROLES = [
  'Sócio ou Fundador', 'Presidente ou CEO', 'C-Level',
  'Diretor', 'Gerente', 'Analista',
]

const REVENUES = [
  'Até R$500 mil/ano', 'R$500 mil a R$1 milhão/ano',
  'R$1 a R$5 milhões/ano', 'R$5 a R$10 milhões/ano',
  'R$10 a R$50 milhões/ano', 'R$50 a R$100 milhões/ano',
  'Acima de R$100 milhões/ano', 'Ainda não faturo',
]

const EMPLOYEES = [
  '1 a 5 colaboradores', '6 a 10 colaboradores',
  '11 a 20 colaboradores', '20 a 50 colaboradores',
  '50 a 100 colaboradores', '100 a 300 colaboradores',
  'Mais de 300 colaboradores',
]

const NEEDS = [
  'Mentoria Individual', 'Mentoria em Grupo', 'Curso Gravado', 'Consultoria Implementada',
]

const PAINS = [
  'Processos manuais e repetitivos', 'Equipe sobrecarregada', 'Alto custo operacional',
  'Dificuldade em escalar', 'Atendimento ao cliente ineficiente', 'Falta de tempo para estratégia',
]

const AI_EXPERIENCE = [
  'Nunca tentei usar IA', 'Tentei mas não funcionou', 'Uso pontualmente', 'Já uso mas quero expandir',
]

const AI_AREA = [
  'Atendimento / Vendas', 'Marketing / Conteúdo', 'Financeiro / Administrativo',
  'RH / Recrutamento', 'Operação / Produção',
]

function Avatar() {
  return (
    <div className="avatar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor" opacity="0.4"/>
        <circle cx="12" cy="12" r="3" fill="currentColor"/>
      </svg>
    </div>
  )
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const [options, setOptions] = useState([])
  const [optionsActive, setOptionsActive] = useState(false)
  const [inputMode, setInputMode] = useState(null)
  const [inputPlaceholder, setInputPlaceholder] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [completedSteps, setCompletedSteps] = useState(0)
  const [showCalendly, setShowCalendly] = useState(false)
  const [largeOptions, setLargeOptions] = useState(false)

  const resolverRef = useRef(null)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const hasRun = useRef(false)

  const utmRef = useRef((() => {
    const p = new URLSearchParams(window.location.search)
    return {
      utm_source:   p.get('utm_source')   || null,
      utm_medium:   p.get('utm_medium')   || null,
      utm_campaign: p.get('utm_campaign') || null,
      utm_term:     p.get('utm_term')     || null,
      utm_content:  p.get('utm_content')  || null,
      fbclid:       p.get('fbclid')       || null,
    }
  })())

  useEffect(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [messages, typing, options, showCalendly])

  useEffect(() => {
    if (inputMode && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [inputMode])


  const addMsg = (type, text) => new Promise(resolve => {
    setMessages(m => [...m, { id: `${Date.now()}-${Math.random()}`, type, text }])
    setTimeout(resolve, 30)
  })

  const botSay = async (text) => {
    const t = Math.min(Math.max(text.length * 12, 500), 1200)
    setTyping(true)
    await delay(t)
    setTyping(false)
    await addMsg('bot', text)
  }

  const waitForChoice = (opts, large = false) => new Promise(resolve => {
    resolverRef.current = resolve
    setLargeOptions(large)
    setOptions(opts)
    setOptionsActive(true)
    setInputMode(null)
  })

  const waitForText = (mode, placeholder) => new Promise(resolve => {
    resolverRef.current = resolve
    setInputMode(mode)
    setInputPlaceholder(placeholder)
    setInputVal('')
    setOptions([])
    setOptionsActive(false)
  })

  const handleOptionClick = (opt) => {
    if (!optionsActive) return
    setOptionsActive(false)
    setOptions([])
    setLargeOptions(false)
    addMsg('user', opt.label)
    const res = resolverRef.current
    resolverRef.current = null
    res?.(opt)
  }

  const handleSubmit = () => {
    const val = inputVal.trim()
    if (!val) return
    setInputMode(null)
    setInputVal('')
    addMsg('user', val)
    const res = resolverRef.current
    resolverRef.current = null
    res?.(val)
  }

  const formatPhone = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 11)
    if (!d) return ''
    if (d.length <= 2) return `(${d}`
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  useEffect(() => {
    const run = async () => {
      await botSay('Empresas que aplicam IA da forma certa estão reduzindo custos em até 40% e aumentando receita sem aumentar time. Quer descobrir como implementar IA de forma eficaz pode mudar o seu negócio?')
      await waitForChoice([{ label: 'Então bora começar! 🚀', val: 'start' }])

      // 1 — Nome
      setCompletedSteps(1)
      await botSay('Qual seu nome?')
      const name = await waitForText('text', 'Digite seu nome...')

      // 2 — WhatsApp
      setCompletedSteps(2)
      await botSay(`Prazer, ${name}! Qual seu WhatsApp?`)
      const phone = await waitForText('phone', '(11) 99999-9999')
      const digits = phone.replace(/\D/g, '')
      const cityInfo = dddToCity[digits.substring(0, 2)] || null

      // 3 — Cidade
      setCompletedSteps(3)
      if (cityInfo) {
        await botSay(`Que legal! ${cityInfo.stateMsg} Me passa sua cidade que já te envio um material top!`)
      } else {
        await botSay('Ótimo! Me passa sua cidade que já te envio um material top!')
      }
      await botSay('De qual cidade você está falando com a gente?')
      const city = await waitForText('text', cityInfo?.city || 'Sua cidade...')

      // 4 — Email
      setCompletedSteps(4)
      await botSay('Qual seu e-mail?')
      const email = await waitForText('email', 'seu@email.com')

      // 5 — Empresa
      setCompletedSteps(5)
      await botSay('Ótimo! Qual o nome da sua empresa?')
      const company = await waitForText('text', 'Nome da empresa...')

      // 6 — Segmento
      setCompletedSteps(6)
      await botSay('Selecione o segmento da empresa:')
      const segOpt = await waitForChoice(SEGMENTS.map(s => ({ label: s, val: s })), true)

      // 7 — Cargo
      setCompletedSteps(7)
      await botSay('Selecione o cargo:')
      const roleOpt = await waitForChoice(ROLES.map(r => ({ label: r, val: r })))

      // 8 — Faturamento
      setCompletedSteps(8)
      await botSay('Sua posição é fundamental para analisar a fundo as automações e ver o impacto direto no dia a dia da empresa! É uma oportunidade e tanto para trazer ferramentas que facilitam o trabalho e impulsionam os resultados. Hoje, qual é o seu faturamento anual?')
      const revenueOpt = await waitForChoice(REVENUES.map(r => ({ label: r, val: r })))

      // 9 — Colaboradores
      setCompletedSteps(9)
      await botSay('Excelente! Com essas informações, já temos dados para seu diagnóstico. Quantos colaboradores a empresa possui?')
      const employeesOpt = await waitForChoice(EMPLOYEES.map(e => ({ label: e, val: e })))

      // 10 — Necessidade
      setCompletedSteps(10)
      await botSay('Perfeito! O que você está buscando agora?')
      const needOpt = await waitForChoice(NEEDS.map(n => ({ label: n, val: n })))

      // 11 — Maior dor
      setCompletedSteps(11)
      await botSay('Qual é a sua maior dor hoje no negócio?')
      const painOpt = await waitForChoice(PAINS.map(p => ({ label: p, val: p })))

      // 12 — Experiência com IA
      setCompletedSteps(12)
      await botSay('Já tentou usar IA no seu negócio?')
      const aiExpOpt = await waitForChoice(AI_EXPERIENCE.map(a => ({ label: a, val: a })))

      // 13 — Área para automatizar
      setCompletedSteps(13)
      await botSay('Qual área você quer automatizar primeiro?')
      const aiAreaOpt = await waitForChoice(AI_AREA.map(a => ({ label: a, val: a })))

      // Salvar no Supabase
      try {
        await supabase.from('leads').insert({
          name,
          phone,
          city,
          email,
          company,
          segment: segOpt.val,
          role: roleOpt.val,
          revenue: revenueOpt.val,
          employees: employeesOpt.val,
          need: needOpt.val,
          pain: painOpt.val,
          ai_experience: aiExpOpt.val,
          ai_area: aiAreaOpt.val,
          ...utmRef.current,
        })
        if (window.fbq) window.fbq('track', 'Lead')
      } catch (e) {
        console.error('Supabase insert error:', e)
      }

      // Notificar via WhatsApp
      try {
        const utm = utmRef.current
        const msg = [
          `🟢 *Novo Lead — Form Preenchido*`,
          ``,
          `👤 *Nome:* ${name}`,
          `📱 *Telefone:* 55${phone.replace(/\D/g, '')}`,
          `📍 *Cidade:* ${city}`,
          `📧 *Email:* ${email}`,
          `🏢 *Empresa:* ${company}`,
          `🏭 *Segmento:* ${segOpt.val}`,
          `💼 *Cargo:* ${roleOpt.val}`,
          `💰 *Faturamento:* ${revenueOpt.val}`,
          `👥 *Colaboradores:* ${employeesOpt.val}`,
          ``,
          `🎯 *Qualificação*`,
          `💡 *Necessidade:* ${needOpt.val}`,
          `😣 *Maior dor:* ${painOpt.val}`,
          `🤖 *Experiência com IA:* ${aiExpOpt.val}`,
          `⚡ *Área para automatizar:* ${aiAreaOpt.val}`,
          ``,
          `📊 *Origem do Lead*`,
          `📣 *Fonte:* ${utm.utm_source || '—'}`,
          `🎯 *Meio:* ${utm.utm_medium || '—'}`,
          `📢 *Campanha:* ${utm.utm_campaign || '—'}`,
          `🔑 *Termo:* ${utm.utm_term || '—'}`,
          `🖼️ *Anúncio:* ${utm.utm_content || '—'}`,
          `🔗 *Facebook Click ID:* ${utm.fbclid ? 'Sim' : '—'}`,
        ].join('\n')
        await fetch('https://smv2-8.stevo.chat/send/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': '1769036519293fRvOnazfAzj4wi2q',
          },
          body: JSON.stringify({ number: '5534988213494', text: msg }),
        })
        // Mensagem para o lead
        const leadPhone = '55' + phone.replace(/\D/g, '')
        const needLabel = {
          'Mentoria Individual':       'uma mentoria individual',
          'Mentoria em Grupo':         'uma mentoria em grupo',
          'Curso Gravado':             'um curso gravado',
          'Consultoria Implementada':  'uma consultoria implementada',
        }[needOpt.val] || needOpt.val.toLowerCase()
        const leadMsg = `Olá ${name}, tudo bem? Vi que você preencheu o formulário buscando ${needLabel} para sua empresa de ${segOpt.val}.\n\nEntendo que "${painOpt.val}" é um desafio real — e é exatamente esse tipo de problema que resolvemos com IA aqui na Winner I.A.\n\nPra entender como conseguimos te ajudar, hoje quais seriam suas necessidades em relação a I.A por aí?`
        await fetch('https://smv2-8.stevo.chat/send/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': '1769036519293fRvOnazfAzj4wi2q',
          },
          body: JSON.stringify({ number: leadPhone, text: leadMsg }),
        })
      } catch (e) {
        console.error('WhatsApp notification error:', e)
      }

      // Final
      setCompletedSteps(13)
      await botSay('Obrigado! Em breve entraremos em contato com você pelo WhatsApp. 🚀')
    }

    if (hasRun.current) return
    hasRun.current = true
    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="progress-track">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="progress-segment">
              <div className={`pdot ${i < completedSteps ? 'done' : ''}`} />
              {i < TOTAL_STEPS - 1 && (
                <div className={`pline ${i < completedSteps - 1 ? 'done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        <div className="step-counter">
          {Math.min(completedSteps, TOTAL_STEPS)} de {TOTAL_STEPS}
        </div>
      </header>

      {/* Chat */}
      <div className="chat">
        {messages.map(msg => (
          msg.type === 'bot' ? (
            <div key={msg.id} className="msg-bot">
              <Avatar />
              <p className="bot-text">{msg.text}</p>
            </div>
          ) : (
            <div key={msg.id} className="msg-user">
              <span className="user-pill">{msg.text}</span>
            </div>
          )
        ))}

        {typing && (
          <div className="msg-bot">
            <Avatar />
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={chatEndRef} style={{ height: 1 }} />
      </div>

{/* Options panel */}
      {options.length > 0 && (
        <div className={`options-panel ${largeOptions ? 'options-panel-large' : ''}`}>
          {options.map(opt => (
            <button
              key={opt.val}
              className="opt-btn"
              onClick={() => handleOptionClick(opt)}
              disabled={!optionsActive}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      {inputMode && (
        <div className="input-bar">
          <input
            ref={inputRef}
            type={inputMode === 'email' ? 'email' : inputMode === 'phone' ? 'tel' : 'text'}
            placeholder={inputPlaceholder}
            value={inputVal}
            onChange={e =>
              setInputVal(inputMode === 'phone' ? formatPhone(e.target.value) : e.target.value)
            }
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button
            className="send-btn"
            onClick={handleSubmit}
            disabled={!inputVal.trim()}
            aria-label="Enviar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

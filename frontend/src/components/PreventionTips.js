import { motion } from 'framer-motion';

const tips = [
  {
    icon: '🔥',
    title: 'Never Leave Campfires Unattended',
    desc: 'Always fully extinguish campfires with water and dirt. Stir the ashes and feel for heat before leaving. One abandoned campfire can destroy thousands of acres.',
  },
  {
    icon: '🚬',
    title: 'Dispose of Cigarettes Properly',
    desc: 'Never throw cigarette butts from vehicles or onto dry ground. Use designated ashtrays. A single cigarette can ignite dry grass in seconds.',
  },
  {
    icon: '⚡',
    title: 'Be Careful with Equipment',
    desc: 'Sparks from machinery, power tools, and vehicles can start fires. Avoid using equipment on hot, dry, windy days and always have a fire extinguisher nearby.',
  },
  {
    icon: '🏠',
    title: 'Create Defensible Space',
    desc: 'Clear flammable vegetation at least 30 feet around your home. Trim tree branches, remove dead plants, and keep your roof and gutters free of leaves.',
  },
  {
    icon: '📞',
    title: 'Report Fires Immediately',
    desc: 'If you see smoke or fire, call emergency services right away. Early detection is the single most important factor in preventing small fires from becoming catastrophic.',
  },
  {
    icon: '🌿',
    title: 'Respect Burn Bans',
    desc: 'Always check local fire restrictions before burning debris or having outdoor fires. During dry seasons, even a controlled burn can quickly spiral out of control.',
  }
];

function TipCard({ tip, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{
        scale: 1.04, y: -6,
        transition: { duration: 0.2 }
      }}
    >
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '30px 26px',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(255,140,0,0.5), transparent)'
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14
        }}>
          <div style={{
            fontSize: 28,
            width: 48, height: 48,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12
          }}>{tip.icon}</div>
          <h3 style={{
            color: '#e8e8e8', fontSize: 16, fontWeight: 600,
            lineHeight: 1.3
          }}>
            {tip.title}
          </h3>
        </div>
        <p style={{
          color: '#888', fontSize: 13.5, lineHeight: 1.7
        }}>
          {tip.desc}
        </p>
      </div>
    </motion.div>
  );
}

export default function PreventionTips() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      padding: 'clamp(50px, 8vw, 100px) clamp(16px, 5vw, 40px) 80px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: 60 }}
      >
        <span style={{
          color: '#FF8C00', fontSize: 13, fontWeight: 500,
          letterSpacing: 4, textTransform: 'uppercase',
          display: 'block', marginBottom: 14
        }}>
          Prevention Guide
        </span>
        <h2 style={{
          color: '#fff', fontSize: 'clamp(26px, 6vw, 36px)', fontWeight: 700,
          marginBottom: 14
        }}>
          How to Prevent Wildfires
        </h2>
        <p style={{ color: '#666', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
          Every year, millions of acres burn due to preventable causes.
          Here's how you can make a difference.
        </p>
      </motion.div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
        maxWidth: 1000,
        margin: '0 auto'
      }}>
        {tips.map((tip, i) => (
          <TipCard key={i} tip={tip} delay={i * 0.1} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 0.8, delay: 0.6 }}
        style={{
          textAlign: 'center', marginTop: 60,
          color: '#333', fontSize: 12
        }}
      >
        Data provided by NASA FIRMS
      </motion.div>
    </div>
  );
}
